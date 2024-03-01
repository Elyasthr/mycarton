import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const CartonsController = () => import('#cartons/controllers/cartons_controller')
const AuthController = () => import('#auth/controllers/auth_controller')

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
  })
  .prefix('user')
  .use(middleware.guest())

router.delete('logout', [AuthController, 'logout']).use(middleware.silent())

router
  .group(() => {
    router.get('/cartons/:id', [CartonsController, 'view'])
    router.post('/cartons/add', [CartonsController, 'add'])
    router.delete('/cartons/:id', [CartonsController, 'delete'])

    router.get('/merchant/:id/cartons', [CartonsController, 'listForMerchant'])
  })
  .use(middleware.auth())
