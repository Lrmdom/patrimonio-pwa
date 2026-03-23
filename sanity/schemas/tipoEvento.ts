import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'tipoEvento',
  title: 'Tipo de Evento',
  type: 'document',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'object',
      of: [{type: 'localeString'}],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'cor',
      title: 'Cor',
      type: 'string',
      options: {
        list: [
          {title: 'Festival', value: 'purple'},
          {title: 'Feira', value: 'orange'},
          {title: 'Espetáculo', value: 'pink'},
          {title: 'Desportivo', value: 'indigo'},
          {title: 'Outro', value: 'gray'}
        ]
      },
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: {
      title: 'titulo',
      cor: 'cor'
    },
    prepare({title, cor}) {
      return {
        title: title?.pt || 'Sem título',
        subtitle: `Cor: ${cor}`
      }
    }
  }
})
