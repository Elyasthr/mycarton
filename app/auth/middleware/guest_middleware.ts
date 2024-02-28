import type { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

export default class GuestMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const isAuthenticated = await ctx.auth.check()

    if (isAuthenticated) {
      return ctx.response.unauthorized({
        message: 'Access Denied. You do not have permission to access this resource.',
        code: 'E_UNAUTHORIZED',
      })
    }

    await next()
  }
}
