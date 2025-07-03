#include <string.h>

#include "tccbot.h"
#include "logmod.h"

void tccbot_dashboard_send(struct discord *client, const char *event_type, const char *class_id,
                           const char *data_json)
{
    struct tccbot_context *ctx = discord_get_data(client);

    // Check if WebSocket connection is active
    if (!ctx->ws_running || !ctx->dashboard_ws)
    {
        logmod_log(WARN, NULL, "⚠️ Dashboard not connected, skipping send: %s", event_type);
        return;
    }

    char buf[2048];

    jsonb_init(&ctx->serial.b);
    jsonb_object(&ctx->serial.b, buf, sizeof(buf));
    {
        jsonb_key(&ctx->serial.b, buf, sizeof(buf), "event", sizeof("event") - 1);
        jsonb_string(&ctx->serial.b, buf, sizeof(buf), "bot_event", sizeof("bot_event") - 1);
        jsonb_key(&ctx->serial.b, buf, sizeof(buf), "data", sizeof("data") - 1);
        jsonb_object(&ctx->serial.b, buf, sizeof(buf));
        {
            jsonb_key(&ctx->serial.b, buf, sizeof(buf), "classId", sizeof("classId") - 1);
            jsonb_string(&ctx->serial.b, buf, sizeof(buf), class_id, strlen(class_id));
            jsonb_key(&ctx->serial.b, buf, sizeof(buf), "teacherId", sizeof("teacherId") - 1);
            jsonb_string(&ctx->serial.b, buf, sizeof(buf), "teacher_1", sizeof("teacher_1") - 1);
            jsonb_key(&ctx->serial.b, buf, sizeof(buf), "event", sizeof("event") - 1);
            jsonb_string(&ctx->serial.b, buf, sizeof(buf), event_type, strlen(event_type));
            jsonb_key(&ctx->serial.b, buf, sizeof(buf), "payload", sizeof("payload") - 1);
            jsonb_token(&ctx->serial.b, buf, sizeof(buf), data_json, strlen(data_json));
        }
        jsonb_object_pop(&ctx->serial.b, buf, sizeof(buf));
    }
    jsonb_object_pop(&ctx->serial.b, buf, sizeof(buf));

    size_t sent = 0;
    const CURLcode res = curl_ws_send(ctx->dashboard_ws, buf, ctx->serial.b.pos, &sent, 0, CURLWS_TEXT);
    if (res != CURLE_OK)
    {
        logmod_log(WARN, NULL, "✗ Failed to send to dashboard: %s", curl_easy_strerror(res));
        // Mark connection as broken to trigger reconnection
        ctx->ws_running = false;
        return;
    }
    logmod_log(INFO, NULL, "✓ Sent to dashboard: %s", buf);
}

void tccbot_dashboard_recv(struct discord *client, const char *payload, const size_t len)
{
    if (!payload || !len)
        return;

    logmod_log(INFO, NULL, "Processing dashboard event: %s", payload);

    struct tccbot_context *ctx = discord_get_data(client);
    jsmnf_init(&ctx->parser.l);
    if (0 >= jsmnf_load(&ctx->parser.l, payload, len, ctx->parser.table, sizeof(ctx->parser.table) / sizeof(ctx->parser.table[0])))
    {
        logmod_log(ERROR, NULL, "✗ Failed to parse dashboard message: %s", payload);
        return;
    }
    const jsmnf_pair *f = jsmnf_find(ctx->parser.l.root, "event", sizeof("event") - 1);
    if (!f)
    {
        logmod_log(ERROR, NULL, "✗ No 'event' field found in message: %s", payload);
        return;
    }

    const char *recv_event_type = payload + f->v->start;
    const int recv_event_len = f->v->end - f->v->start;
    if (strncmp("start_class", recv_event_type, recv_event_len) == 0)
        tccbot_dashboard_on_start_class(client, payload, len);
    else if (strncmp("end_class", recv_event_type, recv_event_len) == 0)
        tccbot_dashboard_on_end_class(client, payload, len);
    else if (strncmp("create_poll", recv_event_type, recv_event_len) == 0)
        tccbot_dashboard_on_create_poll(client, payload, len);
    else if (strncmp("send_discussion", recv_event_type, recv_event_len) == 0)
        tccbot_dashboard_on_send_discussion(client, payload, len);
    else if (strncmp("active_content", recv_event_type, recv_event_len) == 0)
        tccbot_dashboard_on_active_content(client, payload, len);
    else
        logmod_log(ERROR, NULL, "✗ Unsupported dashboard event: %.*s", recv_event_len, recv_event_type);
}
