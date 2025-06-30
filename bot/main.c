#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>
#include <curl/curl.h>

#include "tccbot.h"
#include "logmod.h"

static void on_ready(struct discord *client, const struct discord_ready *event)
{
    (void)client;
    logmod_log(INFO, NULL, "🚀 TCC Bot connected to Discord as %s!",
               event->user->username);
    logmod_log(INFO, NULL, "Ready to facilitate educational interactions.");
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
        return;

    switch (curl_ws_recv(ctx->dashboard_ws, buf, sizeof(buf), &recv, &frame))
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
        { // libcurl automatically handles pong responses
            logmod_log(INFO, NULL, "📡 Received ping from dashboard");
        }
        else if (frame->flags & CURLWS_CLOSE)
        {
            logmod_log(INFO, NULL, "🔌 Dashboard WebSocket closed");
            discord_shutdown(client);
        }
        break;
    case CURLE_AGAIN:
    default:
        break;
    }
}

int main(void)
{
    int retval = EXIT_FAILURE;
    CURL *dashboard_ws = curl_easy_init();

    logmod_log(INFO, NULL, "🤖 Starting tccbot - Educational Discord Bot");

    // Initialize dashboard WebSocket connection first
    if (!dashboard_ws)
    {
        logmod_log(FATAL, NULL, "✗ Failed to initialize cURL for dashboard WebSocket");
        goto _cleanup;
    }

    const char *ws_url = getenv("DASHBOARD_WS_URL");
    if (!ws_url)
        ws_url = "ws://localhost:3001";
    logmod_log(INFO, NULL, "Connecting to dashboard at %s...", ws_url);

    curl_easy_setopt(dashboard_ws, CURLOPT_URL, ws_url);
    curl_easy_setopt(dashboard_ws, CURLOPT_CONNECT_ONLY, 2L);
    if (curl_easy_perform(dashboard_ws) != CURLE_OK)
    {
        logmod_log(FATAL, NULL, "✗ Failed to connect to dashboard WebSocket");
        goto _cleanup;
    }
    else
    {
        static const char auth_msg[] = "{\"event\":\"authenticate\",\"data\":{\"type\":\"bot\"}}";

        logmod_log(INFO, NULL, "✓ Connected to dashboard WebSocket");
        size_t sent = 0;
        curl_ws_send(dashboard_ws, auth_msg, sizeof(auth_msg) - 1, &sent, 0, CURLWS_TEXT);
        logmod_log(INFO, NULL, "✓ Authenticated with dashboard");
    }

    struct discord *client = discord_from_json("config.json");
    if (!client)
    {
        logmod_log(FATAL, NULL, "✗ Failed to initialize Discord client - check your token");
        goto _cleanup;
    }

    struct tccbot_context ctx = tccbot_context_init(client, dashboard_ws, false);
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
