import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3).maxLength(64),
    adress: vine.string().minLength(5).maxLength(255),
    city: vine.string().minLength(2).maxLength(64),
    zipCode: vine.string().fixedLength(5),
    type: vine.enum(['client', 'shopkeeper']),
    email: vine
      .string()
      .email()
      .unique(async (query, field) => {
        const user = await query.from('users').where('email', field).first()
        return !user
      }),
    password: vine.string().minLength(8).maxLength(32),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(8).maxLength(32),
  })
)
