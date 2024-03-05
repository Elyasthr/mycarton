import type { HttpContext } from '@adonisjs/core/http'
import { cartonValidator } from '../validators/carton_validator.js'
import Carton, { CartonStatus } from '#cartons/models/carton'
import User, { UserType } from '#auth/models/user'

export default class CartonsController {
  async view({ params, response }: HttpContext) {
    const carton = await Carton.findOrFail(params.id)
    return response.ok(carton)
  }

  async add({ request, response, auth }: HttpContext) {
    const user = auth.user!

    if (user.type !== UserType.MERCHANT) {
      return response.forbidden({
        message: 'Access Denied. You do not have permission to access this resource.',
        code: 'E_FORBIDDEN',
      })
    }

    const listCartons = await request.validateUsing(cartonValidator)

    const merchantId = user.id
    const status = CartonStatus.INSTOCK

    let cartonsToCreate: Pick<Carton, 'size' | 'status' | 'merchantId'>[] = []

    listCartons.cartons.forEach((carton) => {
      for (let i = 0; i < carton.quantity; i++) {
        cartonsToCreate.push({
          size: carton.size,
          merchantId,
          status,
        })
      }
    })

    await Carton.createMany(cartonsToCreate)

    return response.created()
  }

  async delete({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const carton = await Carton.findOrFail(params.id)

    if (user.id !== carton.merchantId) {
      return response.forbidden({
        message: 'Access Denied. You do not have permission to access this resource.',
        code: 'E_FORBIDDEN',
      })
    }

    try {
      await carton.delete()
      return response.status(200)
    } catch {
      return response.notFound({ message: 'Carton not found' })
    }
  }

  async listCartons({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)

    if (user.type !== UserType.MERCHANT) {
      return response.forbidden({
        message: 'The specified user is not a merchant.',
        code: 'E_FORBIDDEN',
      })
    }

    const cartons = await Carton.query().where('merchantId', user.id)

    return response.ok(cartons)
  }
}
