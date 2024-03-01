import { CartonSize } from '#cartons/models/carton'
import vine from '@vinejs/vine'

export const cartonValidator = vine.compile(
  vine.object({
    cartons: vine.array(
      vine.object({
        size: vine.enum(CartonSize),
        quantity: vine.number().min(1).max(100),
      })
    ),
  })
)
