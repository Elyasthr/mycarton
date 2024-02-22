import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import User from '#auth/models/user'

const AuthController = () => import('#auth/controllers/auth_controller')

//gérer le fait de pas acceder a cette page si je suis auth
router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
  })
  .prefix('user')

router.post('logout', [AuthController, 'logout'])

router
router
  .get('/me', async ({ auth, response }) => {
    const user = await User.findOrFail(auth.user!.id)

    return response.ok(user)
  })

  .use(middleware.auth({ guards: ['api'] }))
