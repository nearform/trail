declare const _default: import("fastify").FastifyPluginAsync<{
    logger,
    db,
    pool,
    trailsManager: import("@nearform/trail-core").TrailsManager
}, import("http").Server>;

export default _default;