import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cartons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.timestamp('created_at', { useTz: false }).notNullable()
      table.timestamp('updated_at', { useTz: false }).notNullable()
      table.enu('size', ['XS', 'S', 'M', 'L', 'XL', 'XXL']).notNullable()
      table.enu('status', ['INSTOCK', 'RESERVED', 'DELIVERED', 'NOTAVAILABLE']).notNullable()
      table
        .integer('merchant_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('reservation_id')
        .nullable()
        .references('id')
        .inTable('reservations')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
