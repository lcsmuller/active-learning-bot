#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>
#include <curl/curl.h>

#include "tccbot.h"
#include "logmod.h"

struct reconnect_state
{
    int attempts;
    time_t last_attempt;
    int backoff_seconds;
    bool is_reconnecting;
};

static struct reconnect_state reconnect_ctx = {0, 0, 1, false};

static void on_ready(struct discord *client, const struct discord_ready *event)
{
    (void)client;
    logmod_log(INFO, NULL, "🚀 TCC Bot connected to Discord as %s!",
               event->user->username);
    logmod_log(INFO, NULL, "Ready to facilitate educational interactions.");
}

static bool dashboard_connect_ws(CURL *dashboard_ws, const char *ws_url)
{
    logmod_log(INFO, NULL, "🔌 Connecting to dashboard at %s...", ws_url);

    curl_easy_setopt(dashboard_ws, CURLOPT_URL, ws_url);
    curl_easy_setopt(dashboard_ws, CURLOPT_CONNECT_ONLY, 2L);

    if (curl_easy_perform(dashboard_ws) != CURLE_OK)
    {
        logmod_log(ERROR, NULL, "✗ Failed to connect to dashboard WebSocket");
        return false;
    }

    static const char auth_msg[] = "{\"event\":\"authenticate\",\"data\":{\"type\":\"bot\"}}";
    size_t sent = 0;

    if (curl_ws_send(dashboard_ws, auth_msg, sizeof(auth_msg) - 1, &sent, 0, CURLWS_TEXT) != CURLE_OK)
    {
        logmod_log(ERROR, NULL, "✗ Failed to authenticate with dashboard");
        return false;
    }

    logmod_log(INFO, NULL, "✓ Connected and authenticated with dashboard");

    reconnect_ctx.attempts = 0;
    reconnect_ctx.backoff_seconds = 1;
    reconnect_ctx.is_reconnecting = false;

    return true;
}

static void attempt_dashboard_reconnect(struct discord *client)
{
    struct tccbot_context *ctx = discord_get_data(client);
    const char *ws_url = getenv("DASHBOARD_WS_URL");
    if (!ws_url)
        ws_url = "ws://localhost:3001";

    time_t now = time(NULL);
    if (reconnect_ctx.is_reconnecting &&
        (now - reconnect_ctx.last_attempt) < reconnect_ctx.backoff_seconds)
    {
        return;
    }

    reconnect_ctx.is_reconnecting = true;
    reconnect_ctx.last_attempt = now;
    reconnect_ctx.attempts++;

    logmod_log(INFO, NULL, "🔄 Attempting dashboard reconnection (attempt #%d)...",
               reconnect_ctx.attempts);

    if (ctx->dashboard_ws)
        curl_easy_cleanup(ctx->dashboard_ws);

    ctx->dashboard_ws = curl_easy_init();
    if (!ctx->dashboard_ws)
    {
        logmod_log(ERROR, NULL, "✗ Failed to initialize new cURL handle");
        goto backoff;
    }

    if (dashboard_connect_ws(ctx->dashboard_ws, ws_url))
    {
        logmod_log(INFO, NULL, "✅ Dashboard reconnection successful!");
        ctx->ws_running = true;
        return;
    }

backoff:
    // Exponential backoff with jitter (max 300 seconds = 5 minutes)
    reconnect_ctx.backoff_seconds = reconnect_ctx.backoff_seconds * 2;
    if (reconnect_ctx.backoff_seconds > 300)
        reconnect_ctx.backoff_seconds = 300;
    // Add some jitter to prevent thundering herd
    reconnect_ctx.backoff_seconds += (rand() % 10);

    logmod_log(WARN, NULL, "⏰ Dashboard reconnection failed. Next attempt in %d seconds",
               reconnect_ctx.backoff_seconds);

    ctx->ws_running = false;
}

static void on_student_interaction(struct discord *client, const struct discord_interaction *event)
{
    if (!event || !event->data)
    {
        logmod_log(ERROR, NULL, "✗ Invalid interaction event received");
        return;
    }

    struct discord_interaction_response params = {
        .type = DISCORD_INTERACTION_CHANNEL_MESSAGE_WITH_SOURCE,
        .data =
            &(struct discord_interaction_callback_data){
                .flags = DISCORD_MESSAGE_EPHEMERAL,
                .content = "⚠️ Internal Error! Interaction is "
                           "malfunctioning, please "
                           "report to the staff.",
            },
    };
    switch (event->type)
    {
    case DISCORD_INTERACTION_APPLICATION_COMMAND:
        if (tccbot_handle_ask(client, event, &params) == CCORD_OK)
            logmod_log(INFO, NULL, "✓ Handled ask command");
        else if (tccbot_handle_answer(client, event, &params) == CCORD_OK)
            logmod_log(INFO, NULL, "✓ Handled answer command");
        else if (tccbot_handle_help(client, event, &params) == CCORD_OK)
            logmod_log(INFO, NULL, "✓ Handled help command");
        else
            logmod_log(ERROR, NULL, "✗ Unsupported command: %s", event->data->name);
        break;
    case DISCORD_INTERACTION_MODAL_SUBMIT:
        if (tccbot_handle_ask_ack(client, event, &params) == CCORD_OK)
            logmod_log(INFO, NULL, "✓ Handled ask acknowledgment");
        else if (tccbot_handle_answer_ack(client, event, &params) == CCORD_OK)
            logmod_log(INFO, NULL, "✓ Handled answer acknowledgment");
        break;
    case DISCORD_INTERACTION_MESSAGE_COMPONENT:
        if (tccbot_handle_role_select(client, event, &params) == CCORD_OK)
            logmod_log(INFO, NULL, "✓ Handled role select interaction");
        break;
    default:
        logmod_log(ERROR, NULL, "✗ Unsupported interaction type: %d", event->type);
        return;
    }
}

void on_dashboard_interaction(struct discord *client)
{
    static char buf[4096];
    struct tccbot_context *ctx = discord_get_data(client);
    const struct curl_ws_frame *frame;
    size_t recv = 0;

    if (!ctx->ws_running)
    {
        attempt_dashboard_reconnect(client);
        return;
    }

    CURLcode result = curl_ws_recv(ctx->dashboard_ws, buf, sizeof(buf), &recv, &frame);
    switch (result)
    {
    case CURLE_OK:
        if (recv <= 0)
            return;

        buf[recv] = '\0';
        if (frame->flags & CURLWS_TEXT)
        {
            logmod_log(INFO, NULL, "📨 Received from dashboard: %s", buf);
            tccbot_dashboard_recv(client, buf, recv);
        }
        else if (frame->flags & CURLWS_PING)
        {
            logmod_log(INFO, NULL, "📡 Received ping from dashboard");
        }
        else if (frame->flags & CURLWS_CLOSE)
        {
            logmod_log(WARN, NULL, "🔌 Dashboard WebSocket closed by server");
            ctx->ws_running = false;
            // Will trigger reconnection on next call
        }
        break;
    case CURLE_AGAIN:
        // No data available, this is normal
        break;
    case CURLE_RECV_ERROR:
    case CURLE_SEND_ERROR:
    case CURLE_COULDNT_CONNECT:
        logmod_log(WARN, NULL, "🔌 Dashboard connection lost (error: %d), will reconnect...", result);
        ctx->ws_running = false;
        break;
    default:
        logmod_log(WARN, NULL, "🔌 Dashboard WebSocket error (%d), will reconnect...", result);
        ctx->ws_running = false;
        break;
    }
}

int main(void)
{
    int retval = EXIT_FAILURE;
    CURL *dashboard_ws = curl_easy_init();

    logmod_log(INFO, NULL, "🤖 Starting tccbot - Educational Discord Bot");

    // Initialize random seed for reconnection jitter
    srand(time(NULL));

    if (!dashboard_ws)
    {
        logmod_log(FATAL, NULL, "✗ Failed to initialize cURL for dashboard WebSocket");
        goto _cleanup;
    }

    const char *ws_url = getenv("DASHBOARD_WS_URL");
    if (!ws_url)
        ws_url = "ws://localhost:3001";

    if (!dashboard_connect_ws(dashboard_ws, ws_url))
        logmod_log(WARN, NULL, "⚠️ Initial dashboard connection failed, will retry automatically");

    struct discord *client = discord_from_json("config.json");
    if (!client)
    {
        logmod_log(FATAL, NULL, "✗ Failed to initialize Discord client - check your token");
        goto _cleanup;
    }

    struct tccbot_context ctx = tccbot_context_init(client, dashboard_ws, dashboard_ws != NULL);
    if (ctx.setup.roles.size == 0)
    {
        logmod_log(FATAL, NULL, "✗ No roles configured for the bot - please run ./setup first");
        goto _cleanup;
    }

    discord_set_data(client, &ctx);
    discord_set_on_ready(client, &on_ready);
    discord_set_on_interaction_create(client, &on_student_interaction);
    discord_set_on_message_reaction_add(client, &tccbot_dashboard_on_reaction_add);
    discord_set_on_voice_state_update(client, &tccbot_dashboard_on_voice_state_update);
    discord_set_on_idle(client, &on_dashboard_interaction);

    discord_run(client);

    retval = EXIT_SUCCESS;
_cleanup:
    logmod_log(INFO, NULL, "Shutting down TCC Bot...");
    tccbot_context_cleanup(&ctx);
#if 0
    if (client)
        discord_cleanup(client);
#endif

    return retval;
}
