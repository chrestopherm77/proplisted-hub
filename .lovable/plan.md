

## Ajustes no Rastreamento de Page Views

### Problema atual

Cada vez que alguem abre a pagina /lp, um novo UUID e gerado como `sessionId`, criando uma nova entrada em `lp_page_views`. Se a mesma pessoa abrir e fechar varias vezes, aparecem multiplas entradas sem conexao entre si.

### Solucao

**1. Zerar todos os page views existentes**

Deletar todos os registros atuais das tabelas `lp_page_views` e `lp_partial_leads` para comecar do zero.

**2. Identificador unico por visitante via localStorage**

Ao inves de gerar um novo UUID a cada montagem do componente, salvar o ID do visitante no `localStorage`. Se o visitante ja tiver um ID salvo, reutiliza-lo. Assim:
- Primeira visita: gera UUID, salva no localStorage, insere page view
- Visitas seguintes: recupera UUID do localStorage, NAO insere novo page view (verifica se ja existe)

Logica no `LeadFormWizard.tsx`:

```text
const VISITOR_KEY = 'lb_visitor_id';
let visitorId = localStorage.getItem(VISITOR_KEY);
if (!visitorId) {
  visitorId = createClientUuid();
  localStorage.setItem(VISITOR_KEY, visitorId);
}
sessionIdRef.current = visitorId;
```

Para o page view, adicionar uma constraint `UNIQUE` na coluna `session_id` da tabela `lp_page_views` e usar `upsert` com `onConflict: 'session_id'` para evitar duplicatas. Assim, mesmo se o localStorage for limpo, o banco garante unicidade.

**3. Geolocalizacao - verificacao**

A geolocalizacao ja esta implementada no codigo atual. Ela:
- Pede permissao ao usuario via `navigator.geolocation.getCurrentPosition()`
- Faz reverse geocode via Nominatim (OpenStreetMap)
- Pre-preenche cidade e estado nos campos de localizacao do formulario

Nao ha mudancas necessarias na geolocalizacao, apenas garantir que continua funcionando corretamente.

### Alteracoes por arquivo

| Arquivo | Acao |
|---|---|
| Migracao SQL | Deletar dados existentes; adicionar constraint UNIQUE em `lp_page_views.session_id` |
| `src/components/leadform/LeadFormWizard.tsx` | Usar localStorage para persistir visitor ID; usar upsert no page view |

### Detalhes tecnicos

**Limpeza de dados (via insert tool):**
```text
DELETE FROM lp_page_views;
DELETE FROM lp_partial_leads;
```

**Migracao SQL:**
```text
ALTER TABLE lp_page_views ADD CONSTRAINT lp_page_views_session_id_unique UNIQUE (session_id);
```

**LeadFormWizard.tsx - mudancas no useEffect de mount:**
- Trocar `useRef(createClientUuid())` por logica que verifica localStorage primeiro
- Trocar `.insert()` por `.upsert()` com `onConflict: 'session_id'` para que visitas repetidas atualizem o registro existente ao inves de criar duplicatas
- Manter a logica de geolocalizacao como esta

