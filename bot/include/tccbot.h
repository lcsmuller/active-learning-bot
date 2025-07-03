#ifndef TCCBOT_H
#define TCCBOT_H

#include "discord.h"
#include "json-build.h"
#include "jsmn-find.h"

struct tccbot_context
{
    void *dashboard_ws;
    int ws_running;

    struct
    {
        struct jsonb b;
    } serial;
    struct
    {
        struct jsmnf_loader l;
        struct jsmnf_table table[256];
    } parser;

    char class_id[32];
    char teacher_id[32];
    struct
    {
        u64snowflake application_id;
        u64snowflake guild_id;
        u64snowflake rules_channel_id;
        u64snowflake voice_channels_category_id;
        struct strings class_codes;
        struct discord_roles roles;
    } setup;
};

struct tccbot_context tccbot_context_init(struct discord *client, CURL *curl_easy_handle, bool is_setup);

void tccbot_context_cleanup(struct tccbot_context *ctx);

void tccbot_dashboard_send(struct discord *client, const char *event_type, const char *class_id,
                           const char *data_json);

void tccbot_dashboard_recv(struct discord *client, const char *payload, const size_t payload_len);

CCORDcode tccbot_handle_ask(struct discord *client, const struct discord_interaction *event, struct discord_interaction_response *params);

CCORDcode tccbot_handle_ask_ack(struct discord *client, const struct discord_interaction *event, struct discord_interaction_response *params);

CCORDcode tccbot_handle_help(struct discord *client, const struct discord_interaction *event, struct discord_interaction_response *params);

CCORDcode tccbot_handle_role_select(struct discord *client, const struct discord_interaction *event, struct discord_interaction_response *params);

CCORDcode tccbot_handle_answer(struct discord *client, const struct discord_interaction *event, struct discord_interaction_response *params);

CCORDcode tccbot_handle_answer_ack(struct discord *client, const struct discord_interaction *event, struct discord_interaction_response *params);

CCORDcode tccbot_dashboard_on_start_class(struct discord *client, const char *payload, const size_t payload_len);

CCORDcode tccbot_dashboard_on_end_class(struct discord *client, const char *payload, const size_t payload_len);

CCORDcode tccbot_dashboard_on_create_poll(struct discord *client, const char *payload, const size_t payload_len);

CCORDcode tccbot_dashboard_on_send_discussion(struct discord *client, const char *payload, const size_t payload_len);

CCORDcode tccbot_dashboard_on_active_content(struct discord *client, const char *payload, const size_t len);

void tccbot_dashboard_on_reaction_add(struct discord *client, const struct discord_message_reaction_add *event);

void tccbot_dashboard_on_voice_state_update(struct discord *client, const struct discord_voice_state *voice_state);

#endif /*#! TCCBOT_H */
