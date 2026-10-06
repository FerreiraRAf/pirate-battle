# Pirate Battle

Shooter naval 2D com visão superior, feito com **React**, **TypeScript** e **PixiJS**.
Navegue entre ilhas, afunde navios inimigos e faça o máximo de pontos antes do tempo acabar.

**Demo online:** `https://pirate-battle-bice.vercel.app/`


## Tecnologias

| Responsabilidade | Tecnologia |
|---|---|
| Interface e menus | React |
| Renderização do jogo | PixiJS v8 |
| Ferramenta de build | Vite |

## Como rodar

Requisito: Node.js 20 ou superior.

```bash
git clone <url-do-repositorio>
cd pirate-battle
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente http://localhost:5173).

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Verifica os tipos e gera o build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Executa o ESLint |

### Variáveis de ambiente

Nenhuma é necessária por enquanto. O jogo roda inteiramente no navegador.

## Controles

| Ação | Teclado |
|---|---|
| Avançar / ré | `W` / `S` ou `↑` / `↓` |
| Virar à esquerda / direita | `A` / `D` ou `←` / `→` |
| Canhão frontal (1 projétil) | `Espaço` |
| Bordada esquerda (3 projéteis paralelos) | `Q` |
| Bordada direita (3 projéteis paralelos) | `E` |
| Pausar / continuar | Botão na tela |

É possível se mover e atirar ao mesmo tempo. O jogo pausa sozinho quando a janela perde o foco ou a aba fica oculta. Para retomar é preciso clicar em **Continuar**, e nenhum movimento ou tiro do período pausado é acumulado.

As teclas do jogo só são capturadas enquanto a partida está ativa, então os menus mantêm o comportamento normal do teclado.

## Como funciona uma partida

- A partida termina quando o tempo acaba ou a vida do jogador chega a zero. Nesse momento tudo para: movimento, ataques, dano, spawns e contagem de pontos.
- Cada inimigo destruído pelos tiros do jogador vale **1 ponto**. Um Chaser que explode contra o navio do jogador **não** pontua.
- **Chaser:** persegue o jogador, causa dano ao colidir e explode.
- **Shooter:** aproxima-se do jogador e atira quando está dentro do alcance de ataque.
- Os inimigos surgem na borda da arena, longe das ilhas e a uma distância segura do jogador.
- As ilhas bloqueiam navios e projéteis.
- Cada partida usa um **retrato** da configuração tirado ao iniciar. Mudar as opções depois afeta só as próximas partidas.
- Sair da tela de combate ou recarregar a página encerra a partida em andamento sem registrá-la.

## Configuração de gameplay

Todos os valores de balanceamento ficam em **`src/game/config.ts`**, em pixels e segundos (nunca por frame). Mudar o balanceamento não exige alterar os sistemas do jogo.

Opções do jogador e seus limites:

| Opção | Padrão | Mínimo | Máximo |
|---|---|---|---|
| Tempo da partida (segundos) | 90 | 60 | 180 |
| Intervalo de spawn de inimigos (segundos) | 3 | 1 | 10 |

Os demais valores (vida, velocidades, dano, alcance e duração dos projéteis, cooldowns, alcance do Shooter, posição das ilhas) estão no objeto `BALANCE`.

## Estrutura do projeto

```
src/
  components/        Interface React: StartMenu, HUD, GameOverMenu, PixiGame
  game/
    config.ts        Configuração tipada de gameplay e validação das opções
    GameEngine.ts    Ciclo da simulação, estado da partida, pausa e ciclo de vida
    entities/        PlayerShip, Enemy, Projectile, Explosion, Island
    systems/         InputManager, AssetManager, CollisionManager, EnemySpawner
    utils/           collision, math (RNG com seed), visuals
public/assets/       Assets do jogo
```

## Limitações conhecidas

- A renderização não interpola entre os passos da simulação, então em taxas de atualização muito altas (120 Hz ou mais) o movimento pode parecer um pouco menos suave.
- O dano dos navios é mostrado com mudança de cor e um flash ao ser atingido, e não com sprites de navio danificado.
- Alguns textos da interface ainda estão em português. Eles ficam agrupados em um objeto `TEXT` no topo de cada componente, prontos para traduzir.