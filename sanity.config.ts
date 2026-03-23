import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import schemas from './sanity/schemas'

export default defineConfig({
  projectId: 'acaezt04',
  dataset: 'production',
  
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Conteúdo')
          .items([
            S.listItem()
              .title('Eventos')
              .icon(() => '📅')
              .child(
                S.documentTypeList('evento')
                  .title('Eventos')
                  .filter('_type == "evento"')
              ),
            S.listItem()
              .title('Tipos de Evento')
              .icon(() => '🏷️')
              .child(
                S.documentTypeList('tipoEvento')
                  .title('Tipos de Evento')
                  .filter('_type == "tipoEvento"')
              ),
            S.divider(),
            S.listItem()
              .title('Património Cultural')
              .icon(() => '🏛️')
              .child(
                S.documentTypeList('bemCultural')
                  .title('Bens Culturais')
                  .filter('_type == "bemCultural"')
              ),
          ])
    }),
    visionTool()
  ],

  schema: {
    types: schemas
  }
})
