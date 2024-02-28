import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#auth/controllers/auth_controller')

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
  })
  .prefix('user')
  .use(middleware.guest())

router.delete('logout', [AuthController, 'logout']).use(middleware.silent())
