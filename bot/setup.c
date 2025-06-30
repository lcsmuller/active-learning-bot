#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#include "tccbot.h"

static struct discord_create_guild_application_command cmds[] = {
    {
        .name = "ask",
        .description = "Ask a question in the class",
        .options = &(struct discord_application_command_options){
            .size = 1,
            .array = (struct discord_application_command_option[]){
                {
                    .name = "anonymous",
                    .description = "Ask anonymously",
                    .type = DISCORD_APPLICATION_OPTION_BOOLEAN,
                },
            },
        },
        .type = DISCORD_APPLICATION_CHAT_INPUT,
    },
    {
        .name = "execute",
        .description = "Execute highlighted code snippet in the class",
        .type = DISCORD_APPLICATION_CHAT_INPUT,
    },
    {
        .name = "help",
        .description = "Get help with the bot commands",
        .type = DISCORD_APPLICATION_CHAT_INPUT,
    },
    {
        .name = "answer",
        .description = "Answer the currently active content",
        .options = &(struct discord_application_command_options){
            .size = 1,
            .array = (struct discord_application_command_option[]){
                {
                    .name = "anonymous",
                    .description = "Answer anonymously",
                    .type = DISCORD_APPLICATION_OPTION_BOOLEAN,
                },
            },
        },
        .type = DISCORD_APPLICATION_CHAT_INPUT,
    }};

static int _tccbot_save_roles_to_file(struct discord_roles *roles)
{
    FILE *file = fopen("roles.json", "w");
    if (!file)
    {
        logmod_log(ERROR, NULL, "Failed to open roles.json for writing");
        return 0;
    }

    char *json = NULL;
    size_t json_size = 0;
    if (discord_roles_to_json(&json, &json_size, roles) == CCORD_OK)
    {
        fprintf(file, "%s\n", json);
    }
    else
    {
        logmod_log(ERROR, NULL, "Failed to convert roles to JSON");
        fclose(file);
        return 0;
    }
    free(json);
    logmod_log(INFO, NULL, "Saved %d role IDs to roles.json", roles->size);
    return 1;
}

static int tccbot_create_commands(struct discord *client, struct tccbot_context *ctx)
{
    CCORDcode code;

    for (size_t i = 0; i < sizeof(cmds) / sizeof(*cmds); ++i)
    {
        code = discord_create_guild_application_command(client, ctx->setup.application_id, ctx->setup.guild_id, &cmds[i], &(struct discord_ret_application_command){
                                                                                                                              .sync = DISCORD_SYNC_FLAG,
                                                                                                                          });
        if (code != CCORD_OK)
        {
            logmod_log(ERROR, NULL, "%s", discord_strerror(code, client));
            return 0;
        }
    }
    logmod_log(INFO, NULL, "Application commands created successfully in guild %" PRIu64, ctx->setup.guild_id);
    return 1;
}

static struct discord_create_message menu = {
    .content = "🎓 **Welcome to TCC Bot!**\n\nPlease select your class code below to join the class and get access to your class-specific channels:",
    .components = &(struct discord_components){
        .size = 1,
        .array = (struct discord_component[]){
            {
                .type = DISCORD_COMPONENT_ACTION_ROW,
                .components = &(struct discord_components){
                    .size = 1,
                    .array = (struct discord_component[]){
                        {
                            .type = DISCORD_COMPONENT_ROLE_SELECT,
                            .custom_id = "select_class",
                            .placeholder = "Choose your class code...",
                            .min_values = 1,
                            .max_values = 25,
                        },
                    },
                },
            },
        },
    },
};

static int tccbot_create_menu(struct discord *client, struct tccbot_context *ctx)
{
    char **class_codes = ctx->setup.class_codes.array;
    const size_t num_classes = ctx->setup.class_codes.size;
    const u64bitmask default_permissions = DISCORD_PERM_READ_MESSAGE_HISTORY | DISCORD_PERM_VIEW_CHANNEL | DISCORD_PERM_SEND_MESSAGES;
    CCORDcode code;

    // Delete existing roles with the same names
    struct discord_roles roles = {0};
    code = discord_get_guild_roles(client, ctx->setup.guild_id, &(struct discord_ret_roles){.sync = &roles});
    if (code == CCORD_OK && roles.size > 0)
    {
        for (size_t i = 0; i < num_classes; ++i)
        {
            for (int j = 0; j < roles.size; ++j)
            {
                if (strcmp(roles.array[j].name, class_codes[i]) != 0)
                    continue;

                logmod_log(INFO, NULL, "Deleting existing role: %s (%" PRIu64 ")", roles.array[j].name, roles.array[j].id);
                CCORDcode code = discord_delete_guild_role(client, ctx->setup.guild_id, roles.array[j].id, NULL, &(struct discord_ret){
                                                                                                                     .sync = true,
                                                                                                                 });
                if (code != CCORD_OK)
                    logmod_log(ERROR, NULL, "Failed to delete existing role: %s", discord_strerror(code, client));
            }
        }
    }

    // Create new roles based on the class codes
    roles = (struct discord_roles){
        .size = num_classes,
        .array = malloc(num_classes * sizeof(struct discord_role)),
    };
    if (!roles.array)
    {
        logmod_log(ERROR, NULL, "Failed to allocate memory for roles");
        return 0;
    }
    for (size_t i = 0; i < num_classes; ++i)
    {
        code = discord_create_guild_role(client, ctx->setup.guild_id, &(struct discord_create_guild_role){
                                                                          .name = class_codes[i],
                                                                          .permissions = default_permissions,
                                                                          .color = 0x00FF00,
                                                                          .hoist = true,
                                                                      },
                                         &(struct discord_ret_role){.sync = &roles.array[i]});
        if (code != CCORD_OK)
        {
            logmod_log(ERROR, NULL, "Failed to create class selection role: %s", discord_strerror(code, client));
            discord_roles_cleanup(&roles);
            return 0;
        }
        logmod_log(INFO, NULL, "Created role: %s (%" PRIu64 ")", class_codes[i], roles.array[i].id);
    }

    // Save role IDs to roles.json
    if (!_tccbot_save_roles_to_file(&roles))
    {
        logmod_log(ERROR, NULL, "Failed to save role IDs to file");
        discord_roles_cleanup(&roles);
        return 0;
    }

    discord_roles_cleanup(&roles);

    code = discord_create_message(client, ctx->setup.rules_channel_id, &menu, &(struct discord_ret_message){.sync = DISCORD_SYNC_FLAG});
    if (code != CCORD_OK)
    {
        logmod_log(ERROR, NULL, "Failed to create menu: %s", discord_strerror(code, client));
        return 0;
    }
    logmod_log(INFO, NULL, "Class selection menu created successfully in channel %" PRIu64, ctx->setup.rules_channel_id);
    return 1;
}

int main(void)
{
    int retval = EXIT_FAILURE;

    struct discord *client = discord_from_json("config.json");
    if (!client)
    {
        logmod_log(ERROR, NULL, "Failed to create Discord client");
        goto _cleanup;
    }

    struct tccbot_context ctx = tccbot_context_init(client, NULL, true);
    if (!tccbot_create_commands(client, &ctx))
    {
        logmod_log(ERROR, NULL, "Failed to create application commands");
        goto _cleanup;
    }
    if (!tccbot_create_menu(client, &ctx))
    {
        logmod_log(ERROR, NULL, "Failed to create menu");
        goto _cleanup;
    }

    retval = EXIT_SUCCESS;
_cleanup:
    tccbot_context_cleanup(&ctx);
    // discord_cleanup(client);

    return retval;
}