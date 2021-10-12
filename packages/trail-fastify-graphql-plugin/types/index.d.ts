declare const _default: import("fastify").FastifyPluginAsync<{
    graphiql,
    path,
    prefix,
    logger,
    db,
    pool,
    trailsManager: import("@nearform/trail-core").TrailsManager
}, import("http").Server>;

export default _default;