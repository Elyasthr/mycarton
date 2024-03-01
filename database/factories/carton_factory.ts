import factory from '@adonisjs/lucid/factories'
import Carton, { CartonSize, CartonStatus } from '#cartons/models/carton'

export const CartonFactory = factory
  .define(Carton, async () => {
    return {
      size: CartonSize.L,
      status: CartonStatus.INSTOCK,
    }
  })
  .build()
