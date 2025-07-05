#include <string.h>

#include "tccbot.h"
#include "logmod.h"

CCORDcode
tccbot_handle_ask(struct discord *client,
                  const struct discord_interaction *event,
                  struct discord_interaction_response *params)
{
    const char *cmd = event->data->name ? event->data->name : "";
    if (strcmp(cmd, "ask") != 0) return CCORD_BAD_PARAMETER;

    int anonymous = 0;
    if (event->data->options) {
        for (int i = 0; i < event->data->options->size; ++i) {
            const struct discord_application_command_interaction_data_option
                *option = &event->data->options->array[i];
            if (strcmp(option->name, "anonymous") == 0)
                anonymous = option->value && *option->value == 't';
        }
    }
    params->type = DISCORD_INTERACTION_MODAL;
    params->data->content = NULL;
    params->data->components = &(struct discord_components){
        .size = 1,
        .array =
            (struct discord_component[]){
                {
                    .type = DISCORD_COMPONENT_ACTION_ROW,
                    .components =
                        &(struct discord_components){
                            .size = 1,
                            .array =
                                (struct discord_component[]){
                                    {
                                        .type = DISCORD_COMPONENT_TEXT_INPUT,
                                        .custom_id =
                                            anonymous
                                                ? "anonymous_question_input"
                                                : "question_input",
                                        .label =
                                            anonymous
                                                ? "Your Anonymous Question"
                                                : "Your Question",
                                        .style = DISCORD_TEXT_PARAGRAPH,
                                        .placeholder =
                                            "Type your question here...",
                                        .max_length = 512,
                                        .required = true,
                                    },
                                },
                        },
                },
            },
    };
    return discord_create_interaction_response(client, event->id, event->token,
                                               params, NULL);
}

CCORDcode
tccbot_handle_ask_ack(struct discord *client,
                      const struct discord_interaction *event,
                      struct discord_interaction_response *params)
{
    static char student_id[64];
    static char join_time[64];
    static char payload[4096];

    cog_u64tostr(student_id, sizeof(student_id), &event->member->user->id);
    cog_u64tostr(join_time, sizeof(join_time),
                 &(uint64_t){ cog_timestamp_ms() });

    struct tccbot_context *ctx = discord_get_data(client);
    const char *question = NULL, *username = "Anonymous";
    for (int i = 0; i < event->data->components->size; ++i) {
        const struct discord_components *modals =
            event->data->components->array[i].components;
        if (!modals || modals->size == 0) continue;

        for (int j = 0; j < modals->size; ++j) {
            if (strcmp(modals->array[j].custom_id, "anonymous_question_input")
                == 0)
                question = modals->array[j].value;
            else if (strcmp(modals->array[j].custom_id, "question_input") == 0)
            {
                question = modals->array[j].value;
                username = event->member->user->username;
            }
            else
                return CCORD_BAD_PARAMETER;
        }
    }
    if (!question || !*question) {
        params->data->content = "❌ Please provide a valid question!";
        return CCORD_OK;
    }

    jsonb_init(&ctx->serial.b);
    jsonb_object(&ctx->serial.b, payload, sizeof(payload));
    {
        jsonb_key(&ctx->serial.b, payload, sizeof(payload), "studentId",
                  sizeof("studentId") - 1);
        jsonb_string(&ctx->serial.b, payload, sizeof(payload), student_id,
                     strlen(student_id));
        jsonb_key(&ctx->serial.b, payload, sizeof(payload), "question",
                  sizeof("question") - 1);
        jsonb_string(&ctx->serial.b, payload, sizeof(payload), question,
                     strlen(question));
        jsonb_key(&ctx->serial.b, payload, sizeof(payload), "timestamp",
                  sizeof("timestamp") - 1);
        jsonb_string(&ctx->serial.b, payload, sizeof(payload), join_time,
                     strlen(join_time));
        jsonb_key(&ctx->serial.b, payload, sizeof(payload), "username",
                  sizeof("username") - 1);
        jsonb_string(&ctx->serial.b, payload, sizeof(payload), username,
                     strlen(username));
    }
    jsonb_object_pop(&ctx->serial.b, payload, sizeof(payload));
    tccbot_dashboard_send(client, "question_asked", ctx->class_id, payload);
    params->data->content = "📝 Your question has been sent!";
    return discord_create_interaction_response(client, event->id, event->token,
                                               params, NULL);
}

CCORDcode
tccbot_handle_help(struct discord *client,
                   const struct discord_interaction *event,
                   struct discord_interaction_response *params)
{
    (void)client;
    const char *cmd = event->data->name ? event->data->name : "";
    if (strcmp(cmd, "help") != 0) return 0;

    params->data->content =
        "🤖 **tccbot - Educational Assistant**\n\n"
        "**Commands:**\n"
        "`/help` - Show this help message\n"
        "`/ask <anonymous>` - Ask a question\n"
        "`/answer <anonymous>` - Answer the currently active content\n"
        "`/execute` - Execute highlighted code snippet\n"
        "I'm here to facilitate your learning experience! 📚";
    return discord_create_interaction_response(client, event->id, event->token,
                                               params, NULL);
}

CCORDcode
tccbot_handle_role_select(struct discord *client,
                          const struct discord_interaction *event,
                          struct discord_interaction_response *params)
{
    for (int i = 0; i < event->data->values->size; ++i) {
        const char *str_role_id = event->data->values->array[i];
        if (!str_role_id || !*str_role_id) continue;

        u64snowflake role_id = 0ULL;
        cog_strtou64((char *)str_role_id, strlen(str_role_id), &role_id);
        discord_add_guild_member_role(client, event->guild_id,
                                      event->member->user->id, role_id, NULL,
                                      NULL);
    }

    params->data->content =
        "🤖 **tccbot - Educational Assistant**\n\n"
        "You have successfully selected your roles!\n"
        "If you need help, use `/help` command.\n"
        "I'm here to facilitate your learning experience! 📚";
    return discord_create_interaction_response(client, event->id, event->token,
                                               params, NULL);
}

CCORDcode
tccbot_handle_answer(struct discord *client,
                     const struct discord_interaction *event,
                     struct discord_interaction_response *params)
{
    const char *cmd = event->data->name ? event->data->name : "";
    if (strcmp(cmd, "answer") != 0) return CCORD_BAD_PARAMETER;

    int anonymous = 0;
    if (event->data->options) {
        for (int i = 0; i < event->data->options->size; ++i) {
            const struct discord_application_command_interaction_data_option
                *option = &event->data->options->array[i];
            if (strcmp(option->name, "anonymous") == 0)
                anonymous = option->value && *option->value == 't';
        }
    }
    params->type = DISCORD_INTERACTION_MODAL;
    params->data->content = NULL;
    params->data->components = &(struct discord_components){
        .size = 1,
        .array =
            (struct discord_component[]){
                {
                    .type = DISCORD_COMPONENT_ACTION_ROW,
                    .components =
                        &(struct discord_components){
                            .size = 1,
                            .array =
                                (struct discord_component[]){
                                    {
                                        .type = DISCORD_COMPONENT_TEXT_INPUT,
                                        .custom_id =
                                            anonymous
                                                ? "anonymous_answer_input"
                                                : "answer_input",
                                        .label = anonymous
                                                     ? "Your Anonymous Answer"
                                                     : "Your Answer",
                                        .style = DISCORD_TEXT_PARAGRAPH,
                                        .placeholder =
                                            "Type your answer here...",
                                        .max_length = 1024,
                                        .required = true,
                                    },
                                },
                        },
                },
            },
    };
    return discord_create_interaction_response(client, event->id, event->token,
                                               params, NULL);
}

CCORDcode
tccbot_handle_answer_ack(struct discord *client,
                         const struct discord_interaction *event,
                         struct discord_interaction_response *params)
{
    static char student_id[64];
    static char join_time[64];
    static char payload[4096];

    cog_u64tostr(student_id, sizeof(student_id), &event->member->user->id);
    cog_u64tostr(join_time, sizeof(join_time),
                 &(uint64_t){ cog_timestamp_ms() });

    struct tccbot_context *ctx = discord_get_data(client);
    const char *answer = NULL, *username = "Anonymous";
    for (int i = 0; i < event->data->components->size; ++i) {
        const struct discord_components *modals =
            event->data->components->array[i].components;
        if (!modals || modals->size == 0) continue;

        for (int j = 0; j < modals->size; ++j) {
            if (strcmp(modals->array[j].custom_id, "anonymous_answer_input")
                == 0)
                answer = modals->array[j].value;
            else if (strcmp(modals->array[j].custom_id, "answer_input") == 0) {
                answer = modals->array[j].value;
                username = event->member->user->username;
            }
            else
                return CCORD_BAD_PARAMETER;
        }
    }
    if (!answer || !*answer) {
        params->data->content = "❌ Please provide a valid answer!";
        return CCORD_OK;
    }

    jsonb_init(&ctx->serial.b);
    jsonb_object(&ctx->serial.b, payload, sizeof(payload));
    {
        jsonb_key(&ctx->serial.b, payload, sizeof(payload), "studentId",
                  sizeof("studentId") - 1);
        jsonb_string(&ctx->serial.b, payload, sizeof(payload), student_id,
                     strlen(student_id));
        jsonb_key(&ctx->serial.b, payload, sizeof(payload), "answer",
                  sizeof("answer") - 1);
        jsonb_string(&ctx->serial.b, payload, sizeof(payload), answer,
                     strlen(answer));
        jsonb_key(&ctx->serial.b, payload, sizeof(payload), "timestamp",
                  sizeof("timestamp") - 1);
        jsonb_string(&ctx->serial.b, payload, sizeof(payload), join_time,
                     strlen(join_time));
        jsonb_key(&ctx->serial.b, payload, sizeof(payload), "username",
                  sizeof("username") - 1);
        jsonb_string(&ctx->serial.b, payload, sizeof(payload), username,
                     strlen(username));
    }
    jsonb_object_pop(&ctx->serial.b, payload, sizeof(payload));
    tccbot_dashboard_send(client, "answer_submitted", ctx->class_id, payload);
    params->data->content = "💬 Your answer has been submitted!";
    return discord_create_interaction_response(client, event->id, event->token,
                                               params, NULL);
}