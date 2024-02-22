import User from '#auth/models/user'
import { loginValidator, registerValidator } from '#auth/validators/auth_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const user = await User.create(payload)

    return response.created(user)
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)

    const token = await User.accessTokens.create(user)

    return response.ok({
      token,
      ...user.serialize(),
    })
  }

  async logout({ auth }: HttpContext) {
    const user = await User.findByOrFail('id', auth.user!.id)
    const token = auth.user!.currentAccessToken

    await User.accessTokens.delete(user, token.identifier)
  }
}
