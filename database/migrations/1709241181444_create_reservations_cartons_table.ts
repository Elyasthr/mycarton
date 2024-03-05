import { BaseSchema } from '@adonisjs/lucid/schema'

// inutile tu peut supprimer cette table
export default class extends BaseSchema {
  protected tableName = 'reservations_cartons'

  //je veut tout les cartons qui on pour reservationId un id de la table reservation
  //jointure qui prend les reservations et cartons qui ont un id commun
  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('reservation_id').references('id').inTable('reservations').onDelete('CASCADE')
      table.integer('carton_id').references('id').inTable('cartons').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
