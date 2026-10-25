# Simulador de Cor por Camadas (simulador-cor-camadas)

Abrir no navegador: [mborille.github.io/simulador-cor-camadas/simulador-cor-camadas.html](https://mborille.github.io/simulador-cor-camadas/simulador-cor-camadas.html)

Versão arquivada e citável: [DOI 10.6084/m9.figshare.34715211](https://doi.org/10.6084/m9.figshare.34715211)

Estima a cor final de uma lente de contato dental ou laminado cerâmico a partir da cor do preparo, do cimento e da espessura e translucidez da cerâmica, e compara com a cor desejada pelo ΔE00.

## Arquivos

- `simulador-cor-camadas.html`: app de um arquivo só. Abra no navegador (computador ou celular). Nada é enviado a servidor.
- `nucleo/modelo.js`: o modelo de cor em JavaScript puro (Lab, sRGB, CIEDE2000 e camadas), o mesmo usado pelo app.
- `nucleo/teste_modelo.js`: testes do modelo. Rode com `node teste_modelo.js` dentro da pasta `nucleo`.

## Método

1. Cada camada (preparo, cimento, cerâmica) é descrita por uma cor em espessura grossa (L*a*b*, D65) e, para cimento e cerâmica, por um coeficiente de espalhamento S por mm.
2. As cores são convertidas para refletância em sRGB linear e o modelo de Kubelka e Munk é aplicado em três bandas (R, G e B), do preparo para fora: preparo, cimento sobre o preparo, cerâmica sobre o cimento.
3. A refletância final volta para CIELAB. O ΔE00 contra a cor desejada usa CIEDE2000, com os limiares de Paravina et al., J Esthet Restor Dent 2015;27(S1):S1-9: 0,8 (perceptibilidade) e 1,8 (aceitabilidade).
4. A translucidez em 1 mm (TP) é o ΔE00 entre a cerâmica sobre fundo branco e sobre fundo preto, no estilo de Johnston e colaboradores (Int J Prosthodont 1995;8:79-86).
5. Há um modo de calibração: com medidas L*a*b* da cerâmica sobre fundo preto e sobre fundo branco, em espessura conhecida, o app calcula a cor própria e o S por banda e passa a usá-los.
6. O gráfico e a tabela mostram, para três cimentos de referência, o ΔE00 conforme a espessura da cerâmica e a menor espessura que chega a 1,8 e a 0,8.

## Limites (declarar em qualquer publicação)

Os valores iniciais de cor do preparo, do cimento e da cerâmica e os valores de S dos presets HT, MT, LT e MO (que dão TP de cerca de 20, 16, 12 e 8 em 1 mm) são ilustrativos e não vêm de nenhum fabricante. O modelo usa três bandas no lugar de espectro completo e não inclui brilho de superfície, fluorescência, opalescência nem textura. É uma ferramenta de estudo para comparar cenários. Não substitui a prova com cimento de prova (try-in) nem o julgamento clínico, e não foi validada contra medições de espectrofotômetro. Valide antes de usar os números como dado de pesquisa.

Licença MIT.

## Verificação

`node teste_modelo.js` confere os limites físicos do modelo (espessura zero devolve o fundo, espessura grande devolve a cor própria, fundo igual à cor própria não muda), a ida e volta CIELAB, a recuperação de cor própria e S pela calibração (erro abaixo de 3%), a queda do ΔE00 com a espessura sobre preparo escuro e a ordem de luminosidade conforme a opacidade.

## Como citar

Veja `CITATION.cff`.
