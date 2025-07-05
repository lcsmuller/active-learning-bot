#include <string.h>
#include <time.h>

#include "tccbot.h"
#include "logmod.h"

/* see https://discordapi.com/permissions.html#1024 */
#define PERMS_READ (1024)
/* see https://discordapi.com/permissions.html#448824526912 */
#define PERMS_WRITE (448824526912)

static u64snowflake active_channel_id = 0ULL;
static u64snowflake active_message_id = 0ULL;

static int
escape_json_string(char *dest, const char *src, int max_len)
{
    int dest_idx = 0, src_idx = 0;
    while (src[src_idx] && dest_idx < max_len - 1) {
        if (src[src_idx] == '"') {
            if (dest_idx < max_len - 2) {
                dest[dest_idx++] = '\\';
                dest[dest_idx++] = '"';
            }
        }
        else if (src[src_idx] == '\\') {
            if (dest_idx < max_len - 2) {
                dest[dest_idx++] = '\\';
                dest[dest_idx++] = '\\';
            }
        }
        else if (src[src_idx] == '\n') {
            if (dest_idx < max_len - 2) {
                dest[dest_idx++] = '\\';
                dest[dest_idx++] = 'n';
            }
        }
        else if (src[src_idx] == '\r') {
            if (dest_idx < max_len - 2) {
                dest[dest_idx++] = '\\';
                dest[dest_idx++] = 'r';
            }
        }
        else {
            dest[dest_idx++] = src[src_idx];
        }
        src_idx++;
    }
    dest[dest_idx] = '\0';
    return dest_idx;
}

static void
done_create_message(struct discord *client,
                    struct discord_response *resp,
                    const struct discord_message *message)
{
    static const char *emojis[] = {
        "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"
    };

    (void)client;
    (void)resp;

    active_message_id = message->id;
    logmod_log(INFO, NULL, "✅ Active content message sent (id: %" PRIu64 ")",
               message->id);

    const char *content = message->content;
    if (content && strstr(content, "📊 **Poll:")) {
        int option_count = 0;
        for (const char *p = content; *p; p++)
            if (*p >= '1' && *p <= '9' && (p == content || *(p - 1) == '\n')
                && *(p + 1) == '.')
                option_count++;

        for (int i = 1; i <= option_count && i <= 9; ++i)
            discord_create_reaction(client, message->channel_id, message->id,
                                    0, emojis[i - 1], NULL);
    }
}

static void
done_create_channel(struct discord *client,
                    struct discord_response *resp,
                    const struct discord_channel *channel)
{
    (void)resp;
    logmod_log(INFO, NULL,
               "✅ Voice channel '%s' created successfully (id: %" PRIu64 ")",
               channel->name, channel->id);
    active_channel_id = channel->id;

    discord_create_message(client, channel->id,
                           &(struct discord_create_message){
                               .content = "@here Class started! Students can "
                                          "now join the voice channel.",
                           },
                           NULL);
}

CCORDcode
tccbot_dashboard_on_start_class(struct discord *client,
                                const char *payload,
                                const size_t len)
{
    (void)len;
    struct tccbot_context *ctx = discord_get_data(client);

    const jsmnf_pair *f = jsmnf_find_path(ctx->parser.l.root,
                                          (char *[]){ "data", "classId" }, 2);
    if (!f) {
        logmod_log(ERROR, NULL,
                   "✗ No 'classId' field found in start_class message: %s",
                   payload);
        return CCORD_BAD_JSON;
    }
    snprintf(ctx->class_id, sizeof(ctx->class_id), "%.*s",
             f->v->end - f->v->start, payload + f->v->start);

    char recv_class_code[64] = { 0 };
    f = jsmnf_find_path(ctx->parser.l.root, (char *[]){ "data", "classCode" },
                        2);
    if (!f) {
        logmod_log(ERROR, NULL,
                   "✗ No 'classCode' field found in start_class message: %s",
                   payload);
        return CCORD_BAD_JSON;
    }
    snprintf(recv_class_code, sizeof(recv_class_code), "%.*s",
             f->v->end - f->v->start, payload + f->v->start);

    struct discord_roles *roles = &ctx->setup.roles;
    for (int i = 0; i < roles->size; ++i) {
        if (strcmp(recv_class_code, roles->array[i].name) != 0) continue;

        struct discord_overwrite overwrites[] = {
            // give read/write permission for class students
            {
                .id = roles->array[i].id,
                .type = 0, // type role
                .allow = PERMS_READ | PERMS_WRITE,
            },
            // give write permissions to @everyone (but deny read)
            {
                .id = ctx->setup.guild_id,
                .type = 0, // type role
                .deny = PERMS_READ, // deny read permission
                .allow = PERMS_WRITE,
            },
        };
        logmod_log(INFO, NULL, "📚 Class '%s' started (id: %s)",
                   recv_class_code, ctx->class_id);
        discord_create_guild_channel(
            client, ctx->setup.guild_id,
            &(struct discord_create_guild_channel){
                .name = recv_class_code,
                .type = DISCORD_CHANNEL_GUILD_VOICE,
                .parent_id = ctx->setup.voice_channels_category_id,
                .permission_overwrites =
                    &(struct discord_overwrites){
                        .size = sizeof(overwrites) / sizeof(overwrites[0]),
                        .array = overwrites,
                    },
            },
            &(struct discord_ret_channel){
                .done = &done_create_channel,
            });
        tccbot_dashboard_send(client, "start_class_ack", ctx->class_id,
                              "{\"success\":true}");
        return CCORD_OK;
    }
    logmod_log(WARN, NULL, "✓ Class code '%s' not found in configuration",
               recv_class_code);

    tccbot_dashboard_send(client, "start_class_ack", ctx->class_id,
                          "{\"success\":false}");
    return CCORD_BAD_PARAMETER;
}

static void
done_delete_channel(struct discord *client,
                    struct discord_response *resp,
                    const struct discord_channel *channel)
{
    (void)client;
    (void)resp;
    struct tccbot_context *ctx = discord_get_data(client);

    logmod_log(INFO, NULL,
               "✅ Voice channel '%s' deleted successfully (id: %" PRIu64 ")",
               channel->name, channel->id);
    active_channel_id = 0ULL;
    active_message_id = 0ULL; // reset message id when channel is deleted
    tccbot_dashboard_send(client, "class_ended", ctx->class_id,
                          "{\"success\":true}");
    ctx->class_id[0] = '\0';
}

CCORDcode
tccbot_dashboard_on_end_class(struct discord *client,
                              const char *payload,
                              const size_t len)
{
    static char class_code[64] = { 0 };

    (void)len;
    struct tccbot_context *ctx = discord_get_data(client);
    const jsmnf_pair *f = jsmnf_find_path(
        ctx->parser.l.root, (char *[]){ "data", "classCode" }, 2);
    if (!f) {
        logmod_log(ERROR, NULL,
                   "✗ No 'classCode' field found in end_class message: %s",
                   payload);
        return CCORD_BAD_JSON;
    }
    snprintf(class_code, sizeof(class_code), "%.*s", f->v->end - f->v->start,
             payload + f->v->start);

    logmod_log(INFO, NULL, "📝 Class %s ended by teacher", ctx->class_id);

    struct discord_channels channels = { 0 };
    discord_get_guild_channels(
        client, ctx->setup.guild_id,
        &(struct discord_ret_channels){ .sync = &channels });
    for (int i = 0; i < channels.size; i++) {
        const struct discord_channel *channel = &channels.array[i];
        if (channel->type == DISCORD_CHANNEL_GUILD_VOICE && channel->name
            && strcmp(channel->name, class_code) == 0)
        {
            logmod_log(INFO, NULL,
                       "🗑️ Deleting voice channel '%s' (id: %" PRIu64 ")",
                       class_code, channel->id);
            discord_delete_channel(client, channel->id, NULL,
                                   &(struct discord_ret_channel){
                                       .done = &done_delete_channel,
                                   });
            break;
        }
    }
    discord_channels_cleanup(&channels);
    return CCORD_OK;
}

CCORDcode
tccbot_dashboard_on_create_poll(struct discord *client,
                                const char *payload,
                                const size_t len)
{
    (void)payload;
    (void)len;
    struct tccbot_context *ctx = discord_get_data(client);

    logmod_log(INFO, NULL, "📊 Poll created by teacher");
    tccbot_dashboard_send(client, "poll_created", ctx->class_id,
                          "{\"success\":true}");
    return CCORD_OK;
}

CCORDcode
tccbot_dashboard_on_send_discussion(struct discord *client,
                                    const char *payload,
                                    const size_t len)
{
    static char discussion_json[2048];

    (void)len;
    struct tccbot_context *ctx = discord_get_data(client);

    const jsmnf_pair *f = jsmnf_find_path(ctx->parser.l.root,
                                          (char *[]){ "data", "message" }, 2);
    if (!f) {
        logmod_log(ERROR, NULL, "✗ No 'discussion' field found in message: %s",
                   payload);
        return CCORD_BAD_JSON;
    }
    const char *discussion = payload + f->v->start;
    int discussion_len = f->v->end - f->v->start;
    logmod_log(INFO, NULL, "📢 Discussion from teacher: %.*s", discussion_len,
               discussion);

    jsonb_init(&ctx->serial.b);
    jsonb_object(&ctx->serial.b, discussion_json, sizeof(discussion_json));
    {
        jsonb_key(&ctx->serial.b, discussion_json, sizeof(discussion_json),
                  "message", sizeof("message") - 1);
        jsonb_string(&ctx->serial.b, discussion_json, sizeof(discussion_json),
                     discussion, discussion_len);
        jsonb_key(&ctx->serial.b, discussion_json, sizeof(discussion_json),
                  "type", sizeof("type") - 1);
        jsonb_string(&ctx->serial.b, discussion_json, sizeof(discussion_json),
                     "info", sizeof("info") - 1);
        jsonb_key(&ctx->serial.b, discussion_json, sizeof(discussion_json),
                  "teacherId", sizeof("teacherId") - 1);
        jsonb_string(&ctx->serial.b, discussion_json, sizeof(discussion_json),
                     "teacher_1", sizeof("teacher_1") - 1);
    }
    jsonb_object_pop(&ctx->serial.b, discussion_json, sizeof(discussion_json));

    tccbot_dashboard_send(client, "discussion_sent", ctx->class_id,
                          discussion_json);
    return CCORD_OK;
}

CCORDcode
tccbot_dashboard_on_active_content(struct discord *client,
                                   const char *payload,
                                   const size_t len)
{
    static char discord_message[4096];
    static char json_payload[2048];
    static char escaped_content[1024];
    static char escaped_title[256];
    static char poll_title[256];
    static char code_title[256];

    (void)len;
    struct tccbot_context *ctx = discord_get_data(client);
    char content_buffer[2048] = { 0 };

    if (!active_channel_id) {
        logmod_log(
            ERROR, NULL,
            "✗ No active voice channel found for active content message: %s",
            payload);
        return CCORD_BAD_PARAMETER;
    }
    const jsmnf_pair *f = jsmnf_find_path(ctx->parser.l.root,
                                          (char *[]){ "data", "content" }, 2);
    if (!f) {
        logmod_log(ERROR, NULL,
                   "✗ No 'content' field found in active_content message: %s",
                   payload);
        return CCORD_BAD_JSON;
    }
    const char *content = payload + f->v->start;
    int content_len = f->v->end - f->v->start;

    const long unescaped_len = jsmnf_unescape(
        content_buffer, sizeof(content_buffer), content, content_len);
    if (unescaped_len < 0) {
        logmod_log(ERROR, NULL, "✗ Failed to unescape JSON content: %.*s",
                   content_len, content);
        return CCORD_BAD_JSON;
    }
    snprintf(discord_message, sizeof(discord_message), "@here %s",
             content_buffer);
    discord_create_message(client, active_channel_id,
                           &(struct discord_create_message){
                               .content = discord_message,
                           },
                           &(struct discord_ret_message){
                               .done = &done_create_message,
                           });

    logmod_log(INFO, NULL, "📺 Active content from teacher: %.*s", content_len,
               content);

    // Parse content to determine type and extract information
    const char *content_type = "Unknown";
    const char *content_title = "";

    // Determine content type based on content patterns
    if (strstr(content_buffer, "📢 **Discussion:")) {
        content_type = "Discussion";
        // Extract title from "📢 **Discussion:** title"
        const char *title_start =
            strstr(content_buffer, "📢 **Discussion:** ");
        if (title_start) {
            title_start += strlen("📢 **Discussion:** ");
            content_title = title_start;
        }
    }
    else if (strstr(content_buffer, "📊 **Poll:")) {
        content_type = "Poll";
        // Extract title from "📊 **Poll:** question"
        const char *title_start = strstr(content_buffer, "📊 **Poll:** ");
        if (title_start) {
            const char *question_start = title_start + strlen("📊 **Poll:** ");
            const char *question_end = strstr(question_start, "\n");
            if (question_end) {
                int title_len = (int)(question_end - question_start);
                if (title_len > 0 && title_len < 255) {
                    strncpy(poll_title, question_start, title_len);
                    poll_title[title_len] = '\0';
                    content_title = poll_title;
                }
            }
        }
    }
    else if (strstr(content_buffer, "💻 **")) {
        content_type = "Code Snippet";
        // Extract title from "💻 **title**"
        const char *title_start = strstr(content_buffer, "💻 **");
        if (title_start) {
            title_start += strlen("💻 **");
            const char *title_end = strstr(title_start, "**");
            if (title_end) {
                int title_len = (int)(title_end - title_start);
                if (title_len > 0 && title_len < 255) {
                    strncpy(code_title, title_start, title_len);
                    code_title[title_len] = '\0';
                    content_title = code_title;
                }
            }
        }
    }
    else if (strstr(content_buffer, "⭐ **Highlighted")) {
        content_type = "Highlighted Message";
        // Extract title from "⭐ **Highlighted Question:** or "⭐
        // **Highlighted Message:**"
        const char *title_start = strstr(content_buffer, "⭐ **Highlighted ");
        if (title_start) {
            if (strstr(title_start, "Question:**")) {
                content_title = "Highlighted Question";
            }
            else if (strstr(title_start, "Message:**")) {
                content_title = "Highlighted Message";
            }
        }
    }

    escape_json_string(escaped_content, content_buffer,
                       sizeof(escaped_content));
    escape_json_string(escaped_title, content_title, sizeof(escaped_title));

    snprintf(json_payload, sizeof(json_payload),
             "{\"type\":\"%s\",\"title\":\"%s\",\"content\":\"%s\","
             "\"duration\":0,\"isHighlighted\":%s}",
             content_type, escaped_title, escaped_content,
             strstr(content_buffer, "⭐ **Highlighted") ? "true" : "false");

    tccbot_dashboard_send(client, "active_content_sent", ctx->class_id,
                          json_payload);
    return CCORD_OK;
}

void
tccbot_dashboard_on_reaction_add(
    struct discord *client, const struct discord_message_reaction_add *event)
{
    static char reaction_json[1024];
    static char message_id[64];
    static char user_id[64];

    struct tccbot_context *ctx = discord_get_data(client);

    if (event->message_id != active_message_id) return;

    cog_u64tostr(message_id, sizeof(message_id),
                 (u64snowflake *)&event->message_id);
    cog_u64tostr(user_id, sizeof(user_id), (u64snowflake *)&event->user_id);

    jsonb_init(&ctx->serial.b);
    jsonb_object(&ctx->serial.b, reaction_json, sizeof(reaction_json));
    {
        jsonb_key(&ctx->serial.b, reaction_json, sizeof(reaction_json),
                  "userId", sizeof("userId") - 1);
        jsonb_number(&ctx->serial.b, reaction_json, sizeof(reaction_json),
                     (double)event->user_id);
        jsonb_key(&ctx->serial.b, reaction_json, sizeof(reaction_json),
                  "messageId", sizeof("messageId") - 1);
        jsonb_number(&ctx->serial.b, reaction_json, sizeof(reaction_json),
                     (double)event->message_id);
        jsonb_key(&ctx->serial.b, reaction_json, sizeof(reaction_json),
                  "emoji", sizeof("emoji") - 1);
        if (event->emoji->name) {
            jsonb_string(&ctx->serial.b, reaction_json, sizeof(reaction_json),
                         event->emoji->name, strlen(event->emoji->name));
        }
        else {
            jsonb_string(&ctx->serial.b, reaction_json, sizeof(reaction_json),
                         "unknown", sizeof("unknown") - 1);
        }
        jsonb_key(&ctx->serial.b, reaction_json, sizeof(reaction_json),
                  "timestamp", sizeof("timestamp") - 1);
        jsonb_number(&ctx->serial.b, reaction_json, sizeof(reaction_json),
                     (double)time(NULL));
    }
    jsonb_object_pop(&ctx->serial.b, reaction_json, sizeof(reaction_json));

    logmod_log(INFO, NULL, "👆 Reaction added to active message: %s",
               event->emoji->name ? event->emoji->name : "unknown");
    tccbot_dashboard_send(client, "reaction_added", ctx->class_id,
                          reaction_json);
}

void
tccbot_dashboard_on_voice_state_update(
    struct discord *client, const struct discord_voice_state *voice_state)
{
    static char voice_event_json[1024];

    struct tccbot_context *ctx = discord_get_data(client);
    if (!active_channel_id) return;

    const bool joining_active = (voice_state->channel_id == active_channel_id);
    const char *const event_type =
        joining_active ? "student_voice_joined" : "student_voice_left";
    const char *const action = joining_active ? "joined" : "left";

    struct discord_user user = { 0 };
    const CCORDcode code = discord_get_user(client, voice_state->user_id,
                                            &(struct discord_ret_user){
                                                .sync = &user,
                                            });
    if (code != CCORD_OK) {
        logmod_log(ERROR, NULL,
                   "✗ Failed to get user info for voice state update");
        return;
    }

    jsonb_init(&ctx->serial.b);
    jsonb_object(&ctx->serial.b, voice_event_json, sizeof(voice_event_json));
    {
        jsonb_key(&ctx->serial.b, voice_event_json, sizeof(voice_event_json),
                  "userId", sizeof("userId") - 1);
        jsonb_number(&ctx->serial.b, voice_event_json,
                     sizeof(voice_event_json), (double)voice_state->user_id);
        jsonb_key(&ctx->serial.b, voice_event_json, sizeof(voice_event_json),
                  "username", sizeof("username") - 1);
        jsonb_string(&ctx->serial.b, voice_event_json,
                     sizeof(voice_event_json),
                     user.username ? user.username : "Unknown",
                     strlen(user.username ? user.username : "Unknown"));
        jsonb_key(&ctx->serial.b, voice_event_json, sizeof(voice_event_json),
                  "timestamp", sizeof("timestamp") - 1);
        jsonb_number(&ctx->serial.b, voice_event_json,
                     sizeof(voice_event_json), (double)time(NULL));
        jsonb_key(&ctx->serial.b, voice_event_json, sizeof(voice_event_json),
                  "currentChannelId", sizeof("currentChannelId") - 1);
        jsonb_number(&ctx->serial.b, voice_event_json,
                     sizeof(voice_event_json),
                     (double)voice_state->channel_id);
        jsonb_key(&ctx->serial.b, voice_event_json, sizeof(voice_event_json),
                  "activeChannelId", sizeof("activeChannelId") - 1);
        jsonb_number(&ctx->serial.b, voice_event_json,
                     sizeof(voice_event_json), (double)active_channel_id);
    }
    jsonb_object_pop(&ctx->serial.b, voice_event_json,
                     sizeof(voice_event_json));

    logmod_log(INFO, NULL,
               "🎤 Student %s %s voice channel (id: %" PRIu64
               ", channel: %" PRIu64 ")",
               user.username ? user.username : "Unknown", action,
               voice_state->user_id, voice_state->channel_id);

    tccbot_dashboard_send(client, event_type, ctx->class_id, voice_event_json);

    discord_user_cleanup(&user);
}
