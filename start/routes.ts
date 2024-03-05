import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#auth/controllers/auth_controller')
const CartonsController = () => import('#cartons/controllers/cartons_controller')
const ReservationController = () => import('#reservations/controllers/reservations_controller')

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
    router.post('/cartons', [CartonsController, 'add'])
    router.delete('/cartons/:id', [CartonsController, 'delete'])

    router.get('reservations/:id', [ReservationController, 'view'])
    router.post('reservations', [ReservationController, 'add'])
    router.post('reservations/:id/canceled', [ReservationController, 'canceled'])

    router.get('/merchant/:id/cartons', [CartonsController, 'listCartons'])
    router.get('/customer/:id/reservations', [ReservationController, 'listReservation'])
  })
  .use(middleware.auth())
