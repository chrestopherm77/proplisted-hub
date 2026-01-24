

## Plano: Alterar Botão CTA Final

### Resumo
Alterar o texto do botão na seção CTA final de "Começar Agora Gratuitamente" para "Cadastre-se".

---

### Alteração

**Arquivo:** `src/pages/Index.tsx` (linhas 216-223)

**Antes:**
```tsx
<Button 
  size="lg" 
  onClick={() => navigate('/auth')}
  className="bg-white text-primary hover:bg-gray-100 text-lg px-10 py-6 h-auto"
>
  Começar Agora Gratuitamente
  <ArrowRight className="ml-2 h-5 w-5" />
</Button>
```

**Depois:**
```tsx
<Button 
  size="lg" 
  onClick={() => navigate('/auth')}
  className="bg-white text-primary hover:bg-gray-100 text-lg px-10 py-6 h-auto"
>
  Cadastre-se
  <ArrowRight className="ml-2 h-5 w-5" />
</Button>
```

---

### Resultado

- Texto do botão muda de "Começar Agora Gratuitamente" para "Cadastre-se"
- O comportamento permanece o mesmo (navega para `/auth` onde está o formulário de cadastro)
- Visual e estilo mantidos

