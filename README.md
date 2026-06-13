# Simulador de Vigas

Simulador de vigas para estudantes de Engenharia. Calcula reações de apoio, diagramas de esforço cortante V(x), momento fletor M(x), flecha elástica δ(x), energia de deformação e realiza análises paramétricas comparativas.

## Funcionalidades

- **Configurações de apoio**: simplesmente apoiada, balanço (engastada-livre), com balanço e contínua (Clapeyron)
- **Tipos de carga**: pontual, distribuída uniforme, distribuída trapezoidal e momento concentrado
- **Diagramas SVG**: V(x), M(x) e δ(x) com anotação de extremos
- **Resultados numéricos**: reações, momento máximo, flecha máxima, verificação de tensão
- **Análise Paramétrica**: estudo comparativo por meio de varredura paramétrica de variáveis (como comprimento da viga ou posição da carga) plotado em gráficos de múltiplas curvas (ex: Aço vs Alumínio)
- **Energia de Deformação e Castigliano**: determinação da energia de deformação interna acumulada na viga e deslocamentos pontuais específicos utilizando o Teorema de Castigliano
- **Interface responsiva**: layout dinâmico adaptável para desktop e mobile, com abas para seleção de modo (Análise Simples ou Paramétrica)

## Tecnologias

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/) 8
- SVG puro para diagramas e gráficos comparativos (sem dependências externas)
- CSS vanilla com custom properties

## Como usar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
```

## Unidades

| Grandeza | Unidade |
|---|---|
| Comprimento | m |
| Força | kN |
| Momento | kN·m |
| Carga distribuída | kN/m |
| Módulo de elasticidade | GPa |
| Momento de inércia | cm⁴ ou mm⁴ |
| Tensão | MPa |
| Energia de deformação | J |
| Deslocamento (Castigliano) | mm |

## Estrutura do Projeto

```
src/
├── engine/          # Motor de cálculo (JS puro)
│   ├── solver.js
│   ├── continuousBeamSolver.js
│   ├── deflection.js
│   ├── diagramData.js
│   ├── strainEnergy.js
│   ├── parametricSweep.js
│   └── validators.js
├── components/
│   ├── InputPanel/   # Painel de configuração
│   ├── BeamSchematic/ # Desenho esquemático SVG
│   ├── Diagrams/     # Diagramas V(x), M(x), δ(x)
│   ├── ResultsTable/ # Tabela de resultados
│   ├── ParametricAnalysis/ # Configuração, gráfico e resultados da varredura paramétrica
│   └── Onboarding/   # Tutorial de uso
└── utils/
    ├── constants.js
    └── unitConversion.js
```
