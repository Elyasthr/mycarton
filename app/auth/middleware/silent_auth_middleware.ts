import type { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const isAuthenticated = await ctx.auth.check()

    if (!isAuthenticated) {
      return ctx.response.status(401).send({ error: 'Accès non autoris' })
    }

    await next()
  }
}
