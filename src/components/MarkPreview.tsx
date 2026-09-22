import React from 'react';
import { StyleSheet, View } from 'react-native';

import { getWinLineById } from '../data/winLines';
import { getDrawMarkById } from '../data/drawMarks';

/**
 * O que o cartao da loja mostra para alinhador e marca de velha.
 *
 * Um emoji e um gradiente nao dizem nada sobre um traco: o jogador estaria
 * gastando 650 estrelas as cegas. Aqui ele ve a coisa de verdade, desenhada
 * com a mesma geometria do jogo, sobre um esboco do tabuleiro.
 *
 * E estatico de proposito. O cartao vive dentro de uma lista rolavel com
 * dezenas de irmaos; animar todos eles ao mesmo tempo custaria caro e ainda
 * competiria pela atencao. O movimento e recompensa da partida, nao da vitrine.
 */

interface MarkPreviewProps {
  kind: 'win_line' | 'draw_mark';
  id: string;
  size?: number;
}

const MarkPreview: React.FC<MarkPreviewProps> = ({ kind, id, size = 84 }) => {
  const def = kind === 'win_line' ? getWinLineById(id) : getDrawMarkById(id);

  const pad = size * 0.16;
  const thickness = Math.max(3, def.thickness * (size / 110));

  const bar = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return {
      left: x1,
      top: y1 - thickness / 2,
      width: Math.hypot(dx, dy),
      height: thickness,
      borderRadius: thickness / 2,
      transform: [{ rotate: `${(Math.atan2(dy, dx) * 180) / Math.PI}deg` }],
    };
  };

  const legs =
    kind === 'win_line'
      ? [bar(pad, pad, size - pad, size - pad)]
      : [bar(pad, pad, size / 2, size - pad), bar(size / 2, size - pad, size - pad, pad)];

  // Dois detalhes na cor do item, para as variantes nao virarem o mesmo cartao.
  const spots =
    kind === 'win_line'
      ? [
          { left: size * 0.38, top: size * 0.38 },
          { left: size * 0.62, top: size * 0.62 },
        ]
      : [
          { left: size * 0.34, top: size * 0.56 },
          { left: size * 0.62, top: size * 0.5 },
        ];

  const dot = Math.max(4, thickness * 0.9);

  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size * 0.14 }]}>
      {/* Esboco do tabuleiro: so o suficiente para o traco ter onde morar. */}
      <View style={[styles.grid, { left: size / 3, top: pad * 0.6, bottom: pad * 0.6 }]} />
      <View style={[styles.grid, { left: (size * 2) / 3, top: pad * 0.6, bottom: pad * 0.6 }]} />
      <View style={[styles.gridH, { top: size / 3, left: pad * 0.6, right: pad * 0.6 }]} />
      <View style={[styles.gridH, { top: (size * 2) / 3, left: pad * 0.6, right: pad * 0.6 }]} />

      {legs.map((leg, i) => (
        <React.Fragment key={i}>
          <View
            style={[
              styles.bar,
              leg,
              {
                top: leg.top - thickness * 0.7,
                height: thickness * 2.4,
                borderRadius: thickness * 1.2,
                backgroundColor: def.color,
                opacity: 0.28,
              },
            ]}
          />
          <View style={[styles.bar, leg, { backgroundColor: def.accent }]} />
        </React.Fragment>
      ))}

      {def.motif !== 'plain' &&
        spots.map((spot, i) => (
          <View
            key={`spot-${i}`}
            style={[
              styles.spot,
              spot,
              {
                width: dot,
                height: dot * (def.motif === 'drip' || def.motif === 'ink' ? 1.5 : 1),
                backgroundColor: i === 0 ? def.color : def.accent,
              },
            ]}
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#141420',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  gridH: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  bar: {
    position: 'absolute',
    transformOrigin: 'left center',
  },
  spot: {
    position: 'absolute',
    borderRadius: 999,
  },
});

export default MarkPreview;
