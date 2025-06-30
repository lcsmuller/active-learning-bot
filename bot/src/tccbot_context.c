#include <stdlib.h>
#include <string.h>

#include <curl/curl.h>

#include "tccbot.h"

struct tccbot_context tccbot_context_init(struct discord *client, CURL *curl_easy_handle, bool is_setup)
{
    const struct ccord_szbuf_readonly
        fld_aid = discord_config_get_field(client, (char *[]){"setup", "application_id"}, 2),
        fld_gid = discord_config_get_field(client, (char *[]){"setup", "guild_id"}, 2),
        fld_rcid = discord_config_get_field(client, (char *[]){"setup", "rules_channel_id"}, 2),
        fld_acid = discord_config_get_field(client, (char *[]){"setup", "announcements_channel_id"}, 2),
        fld_vccid = discord_config_get_field(client, (char *[]){"setup", "voice_channels_category_id"}, 2),
        fld_cc = discord_config_get_field(client, (char *[]){"setup", "class_codes"}, 2);
    u64snowflake aid = 0ULL, gid = 0ULL, rcid = 0ULL, acid = 0ULL, vccid = 0ULL;
    struct strings class_codes = {0};

    cog_strtou64((char *)fld_aid.start, fld_aid.size, &aid);
    cog_strtou64((char *)fld_gid.start, fld_gid.size, &gid);
    cog_strtou64((char *)fld_rcid.start, fld_rcid.size, &rcid);
    cog_strtou64((char *)fld_acid.start, fld_acid.size, &acid);
    cog_strtou64((char *)fld_vccid.start, fld_vccid.size, &vccid);
    strings_from_json(fld_cc.start, fld_cc.size, &class_codes);

    struct tccbot_context new_ctx = {
        .dashboard_ws = curl_easy_handle,
        .ws_running = 1,
        .setup = {
            .application_id = aid,
            .guild_id = gid,
            .rules_channel_id = rcid,
            .announcements_channel_id = acid,
            .voice_channels_category_id = vccid,
            .class_codes = class_codes,
        },
    };

    if (!is_setup)
    {
        size_t json_size = 0;
        char *json = cog_load_whole_file("roles.json", &json_size);
        discord_roles_from_json(json, json_size, &new_ctx.setup.roles);
        free(json);
    }

    return new_ctx;
}

void tccbot_context_cleanup(struct tccbot_context *ctx)
{
    if (ctx->dashboard_ws)
    {
        curl_easy_cleanup(ctx->dashboard_ws);
        ctx->dashboard_ws = NULL;
    }
    if (ctx->setup.class_codes.size)
        strings_cleanup(&ctx->setup.class_codes);
    if (ctx->setup.roles.size)
        discord_roles_cleanup(&ctx->setup.roles);
    memset(ctx, 0, sizeof(*ctx));
}
