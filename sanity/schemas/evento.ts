import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'evento',
  title: 'Evento',
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
      name: 'descricao',
      title: 'Descrição',
      type: 'object',
      of: [{type: 'localeText'}],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'dataInicio',
      title: 'Data de Início',
      type: 'datetime',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'dataFim',
      title: 'Data de Fim (Opcional)',
      type: 'datetime',
      description: 'Para eventos que duram múltiplos dias'
    }),
    defineField({
      name: 'tipo',
      title: 'Tipo de Evento',
      type: 'reference',
      to: [{type: 'tipoEvento'}],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'localizacao',
      title: 'Localização',
      type: 'geopoint',
      description: 'Coordenadas GPS do evento (opcional)'
    }),
    defineField({
      name: 'endereco',
      title: 'Endereço',
      type: 'object',
      of: [{type: 'localeString'}],
      description: 'Endereço textual do evento'
    }),
    defineField({
      name: 'imagem',
      title: 'Imagem',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'link',
      title: 'Link Externo',
      type: 'url',
      description: 'Link para mais informações ou bilhetes'
    })
  ],
  preview: {
    select: {
      title: 'titulo',
      dataInicio: 'dataInicio',
      tipo: 'tipo.title'
    },
    prepare({title, dataInicio, tipo}) {
      const date = new Date(dataInicio).toLocaleDateString('pt-PT')
      return {
        title: title?.pt || 'Sem título',
        subtitle: `${date} • ${tipo?.pt || 'Sem tipo'}`
      }
    }
  }
})
