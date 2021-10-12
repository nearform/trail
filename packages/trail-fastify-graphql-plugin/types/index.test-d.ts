import Fastify from 'fastify';
import plugin from './index.d'

const fastify = Fastify()

fastify.register(plugin)