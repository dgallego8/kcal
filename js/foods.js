// Kcal · Base de alimentos (enfoque Colombia)
// Valores aproximados por porción típica. Referencias: USDA FoodData Central y
// Tabla de Composición de Alimentos Colombianos (ICBF). La preparación cambia
// mucho las calorías (sobre todo el aceite), así que tómalos como una guía.
// Campos: n nombre · u porción · k kcal · p proteína (g) · c carbohidratos (g) · f grasa (g) · e emoji · a sinónimos
import { norm } from './util.js';

export const CATS = {
  harinas: 'Harinas y cereales',
  proteinas: 'Carnes, huevos y pescado',
  granos: 'Granos',
  lacteos: 'Lácteos',
  frutas: 'Frutas',
  verduras: 'Verduras',
  platos: 'Platos típicos',
  rapidas: 'Comida rápida',
  bebidas: 'Bebidas',
  snacks: 'Mecato y postres',
  grasas: 'Grasas, salsas y endulzantes',
  mios: 'Mis alimentos',
};

const F = (id, cat, e, n, u, k, p, c, f, a = '') => ({ id, cat, e, n, u, k, p, c, f, a });

export const FOODS = [
  // ── Harinas y cereales ──────────────────────────────────────────────
  F('arroz-blanco', 'harinas', '🍚', 'Arroz blanco cocido', '1 taza (160 g)', 208, 4.3, 45, 0.5, 'arroz'),
  F('arroz-integral', 'harinas', '🍚', 'Arroz integral cocido', '1 taza (160 g)', 180, 4.2, 37, 1.4, 'arroz'),
  F('arroz-coco', 'harinas', '🥥', 'Arroz con coco', '1 taza (180 g)', 330, 4, 52, 12, 'arroz'),
  F('arepa-blanca', 'harinas', '🫓', 'Arepa de maíz blanca', '1 mediana, sin mantequilla (80 g)', 150, 3.2, 32, 1, 'arepa asada'),
  F('arepa-delgada', 'harinas', '🫓', 'Arepa delgada tipo paisa', '1 unidad (50 g)', 95, 2, 20, 0.7, 'arepa paisa telita'),
  F('arepa-queso', 'harinas', '🫓', 'Arepa rellena de queso', '1 unidad (120 g)', 300, 11, 36, 12.5, 'arepa'),
  F('arepa-choclo', 'harinas', '🌽', 'Arepa de choclo', '1 unidad (120 g)', 280, 6, 42, 10, 'arepa choclo'),
  F('arepa-boyacense', 'harinas', '🫓', 'Arepa boyacense', '1 unidad (100 g)', 290, 7, 40, 11, 'arepa'),
  F('pan-blanco', 'harinas', '🍞', 'Pan blanco tajado', '1 tajada (25 g)', 67, 2.2, 12.5, 0.8, 'pan tajado molde'),
  F('pan-integral', 'harinas', '🍞', 'Pan integral tajado', '1 tajada (28 g)', 70, 3.5, 12, 1, 'pan tajado molde'),
  F('pan-frances', 'harinas', '🥖', 'Pan francés o baguette', '1 unidad pequeña (60 g)', 165, 5.5, 33, 1.2, 'pan baguette'),
  F('pan-panaderia', 'harinas', '🍞', 'Pan de panadería (mantequilla, aliñado)', '1 unidad (60 g)', 200, 5, 30, 6.5, 'pan mogolla rollo aliñado'),
  F('croissant', 'harinas', '🥐', 'Croissant u hojaldre', '1 unidad (60 g)', 245, 5, 27, 12.5, 'cruasan hojaldre pan'),
  F('pandebono', 'harinas', '🧀', 'Pandebono', '1 unidad (40 g)', 140, 4.5, 15, 7, 'pan de bono'),
  F('almojabana', 'harinas', '🧀', 'Almojábana', '1 unidad (50 g)', 160, 6, 18, 7, ''),
  F('bunuelo', 'harinas', '🟠', 'Buñuelo', '1 unidad (45 g)', 170, 4, 16, 10, ''),
  F('pan-yuca', 'harinas', '🥯', 'Pan de yuca', '1 unidad (40 g)', 140, 4, 17, 6.3, ''),
  F('avena-hojuelas', 'harinas', '🥣', 'Avena en hojuelas (cruda)', '3 cucharadas (30 g)', 114, 3.9, 20, 2, 'avena'),
  F('granola', 'harinas', '🥣', 'Granola', '½ taza (50 g)', 230, 5, 32, 9.5, ''),
  F('cereal', 'harinas', '🥣', 'Cereal de hojuelas de maíz', '1 taza (30 g)', 110, 2, 25, 0.2, 'corn flakes zucaritas'),
  F('pasta', 'harinas', '🍝', 'Pasta o espagueti cocido', '1 taza (140 g)', 220, 8, 43, 1.3, 'espaguetis macarrones fideos'),
  F('quinua', 'harinas', '🥣', 'Quinua cocida', '1 taza (185 g)', 222, 8.1, 39, 3.6, 'quinoa'),
  F('papa-cocida', 'harinas', '🥔', 'Papa cocida', '1 mediana (150 g)', 130, 2.9, 30, 0.2, 'papa pastusa sabanera'),
  F('papa-criolla', 'harinas', '🥔', 'Papa criolla cocida', '5 unidades (100 g)', 95, 2, 21, 0.2, 'papa'),
  F('pure-papa', 'harinas', '🥔', 'Puré de papa', '1 taza (210 g)', 237, 4, 35, 9, 'pure'),
  F('papas-francesa', 'harinas', '🍟', 'Papas a la francesa', '1 porción mediana (110 g)', 340, 3.8, 45, 16, 'papas fritas papitas'),
  F('yuca-cocida', 'harinas', '🥔', 'Yuca cocida', '1 porción (150 g)', 195, 1.5, 46, 0.4, 'yuca'),
  F('yuca-frita', 'harinas', '🍟', 'Yuca frita', '1 porción (100 g)', 280, 1.4, 40, 13, 'yuca'),
  F('maduro-frito', 'harinas', '🍌', 'Plátano maduro frito (tajadas)', '4 tajadas (100 g)', 245, 1.5, 40, 9, 'tajadas maduro platano'),
  F('maduro-asado', 'harinas', '🍌', 'Plátano maduro asado o cocido', '½ unidad (100 g)', 122, 0.8, 31, 0.2, 'maduro platano'),
  F('patacon', 'harinas', '🟡', 'Patacón', '1 unidad (35 g)', 110, 0.5, 17, 4.5, 'toston patacones platano verde'),
  F('mazorca', 'harinas', '🌽', 'Mazorca cocida', '1 unidad mediana', 100, 3.4, 21, 1.5, 'choclo maiz'),
  F('galletas-soda', 'harinas', '🍘', 'Galletas de soda', '4 galletas (28 g)', 120, 2.6, 20, 3.3, 'galletas saltinas'),
  F('tortilla', 'harinas', '🌮', 'Tortilla de trigo', '1 unidad (45 g)', 140, 3.7, 23, 3.6, 'wrap'),

  // ── Carnes, huevos y pescado ────────────────────────────────────────
  F('huevo-cocido', 'proteinas', '🥚', 'Huevo cocido', '1 unidad (50 g)', 75, 6.3, 0.6, 5, 'huevo duro tibio'),
  F('huevo-frito', 'proteinas', '🍳', 'Huevo frito', '1 unidad', 95, 6.3, 0.4, 7.5, 'huevo'),
  F('huevos-pericos', 'proteinas', '🍳', 'Huevos pericos o revueltos', '2 huevos', 210, 13, 4, 15.5, 'pericos revueltos huevo'),
  F('omelette', 'proteinas', '🍳', 'Omelette con queso', '2 huevos', 260, 18, 2, 20, 'tortilla de huevo omelet'),
  F('clara', 'proteinas', '🥚', 'Clara de huevo', '1 unidad (33 g)', 17, 3.6, 0.2, 0.1, 'claras'),
  F('pechuga', 'proteinas', '🍗', 'Pechuga de pollo a la plancha', '1 porción (120 g)', 198, 37, 0, 4.3, 'pollo plancha'),
  F('pollo-asado', 'proteinas', '🍗', 'Pollo asado con piel (pierna o muslo)', '1 presa (130 g)', 300, 31, 0, 19.5, 'pollo pernil muslo'),
  F('pollo-frito', 'proteinas', '🍗', 'Pollo frito apanado', '1 presa (140 g)', 380, 30, 12, 23.5, 'broaster apanado pollo'),
  F('pollo-desmechado', 'proteinas', '🍗', 'Pollo desmechado guisado', '½ taza (70 g)', 130, 18, 2, 5.5, 'pollo'),
  F('carne-asada', 'proteinas', '🥩', 'Carne de res asada (magra)', '1 porción (120 g)', 250, 36, 0, 11.5, 'bistec res solomito lomo carne'),
  F('punta-anca', 'proteinas', '🥩', 'Punta de anca asada', '1 porción (120 g)', 330, 32, 0, 22.5, 'picana res carne'),
  F('carne-molida', 'proteinas', '🥩', 'Carne molida guisada', '½ taza (80 g)', 200, 20, 2, 12.5, 'carne'),
  F('higado', 'proteinas', '🥩', 'Hígado de res encebollado', '1 porción (100 g)', 190, 26, 6, 6.5, 'higado'),
  F('cerdo-lomo', 'proteinas', '🥓', 'Lomo de cerdo asado', '1 porción (120 g)', 240, 33, 0, 11.5, 'cerdo marrano'),
  F('chuleta', 'proteinas', '🥓', 'Chuleta de cerdo apanada', '1 unidad (150 g)', 430, 30, 18, 26.5, 'cerdo'),
  F('chicharron', 'proteinas', '🥓', 'Chicharrón', '1 porción (60 g)', 320, 15, 0, 29, ''),
  F('chorizo', 'proteinas', '🌭', 'Chorizo', '1 unidad (75 g)', 260, 13, 2, 22.5, ''),
  F('morcilla', 'proteinas', '🌭', 'Morcilla o rellena', '1 porción (75 g)', 250, 8, 12, 19, 'rellena'),
  F('salchicha', 'proteinas', '🌭', 'Salchicha', '1 unidad (40 g)', 110, 4.5, 1.5, 9.5, ''),
  F('jamon', 'proteinas', '🥓', 'Jamón de cerdo', '1 tajada (20 g)', 28, 3.6, 0.6, 1.2, 'jamon'),
  F('atun-agua', 'proteinas', '🐟', 'Atún en agua (escurrido)', '1 lata (100 g)', 116, 26, 0, 1, 'atun lata'),
  F('atun-aceite', 'proteinas', '🐟', 'Atún en aceite (escurrido)', '1 lata (100 g)', 195, 29, 0, 8.2, 'atun lata'),
  F('pescado-plancha', 'proteinas', '🐟', 'Pescado blanco a la plancha', '1 filete (120 g)', 155, 31, 0, 3.2, 'tilapia basa pescado'),
  F('mojarra', 'proteinas', '🐟', 'Mojarra frita', '1 unidad mediana', 380, 40, 5, 22, 'pescado frito'),
  F('salmon', 'proteinas', '🐟', 'Salmón', '1 filete (120 g)', 250, 26, 0, 15.5, 'salmon pescado'),
  F('camarones', 'proteinas', '🦐', 'Camarones', '1 porción (100 g)', 100, 24, 0.2, 0.3, 'camaron'),
  F('sardinas', 'proteinas', '🐟', 'Sardinas en salsa de tomate', '½ lata (75 g)', 140, 15, 2, 8, ''),

  // ── Granos ──────────────────────────────────────────────────────────
  F('frijoles', 'granos', '🫘', 'Fríjoles cocidos', '1 taza, sin carne (170 g)', 220, 15, 40, 0.9, 'frijoles frisoles'),
  F('frijoles-garra', 'granos', '🫘', 'Fríjoles con garra o tocino', '1 taza (200 g)', 330, 17, 40, 11.5, 'frijoles frisoles'),
  F('lentejas', 'granos', '🫘', 'Lentejas cocidas', '1 taza (200 g)', 230, 18, 40, 0.8, ''),
  F('garbanzos', 'granos', '🫘', 'Garbanzos cocidos', '1 taza (165 g)', 270, 14.5, 45, 4.2, ''),
  F('arvejas', 'granos', '🫛', 'Arvejas cocidas', '½ taza (80 g)', 67, 4.3, 12.5, 0.2, 'alverja'),

  // ── Lácteos ─────────────────────────────────────────────────────────
  F('leche-entera', 'lacteos', '🥛', 'Leche entera', '1 vaso (240 ml)', 150, 7.7, 11.7, 8, 'leche'),
  F('leche-semi', 'lacteos', '🥛', 'Leche semidescremada o deslactosada', '1 vaso (240 ml)', 120, 8, 12, 4.7, 'leche'),
  F('leche-descremada', 'lacteos', '🥛', 'Leche descremada', '1 vaso (240 ml)', 85, 8.3, 12, 0.3, 'leche light'),
  F('yogur', 'lacteos', '🥣', 'Yogur con dulce', '1 vaso (200 g)', 180, 6, 28, 5, 'yogurt'),
  F('yogur-griego', 'lacteos', '🥣', 'Yogur griego natural sin azúcar', '1 porción (150 g)', 120, 14, 6, 4.5, 'yogurt'),
  F('kumis', 'lacteos', '🥛', 'Kumis', '1 vaso (200 ml)', 160, 6, 22, 5.5, ''),
  F('queso-campesino', 'lacteos', '🧀', 'Queso campesino o costeño', '1 tajada (30 g)', 85, 6, 1, 6.5, 'queso cuajada'),
  F('queso-mozzarella', 'lacteos', '🧀', 'Queso mozzarella', '1 tajada (20 g)', 60, 4.4, 0.6, 4.4, 'queso tajado'),
  F('queso-doble-crema', 'lacteos', '🧀', 'Queso doble crema', '1 tajada (30 g)', 100, 6.5, 1, 8, 'queso'),
  F('queso-crema', 'lacteos', '🧀', 'Queso crema', '1 cucharada (15 g)', 50, 0.9, 0.8, 5, 'queso'),
  F('crema-leche', 'lacteos', '🥛', 'Crema de leche', '1 cucharada (15 g)', 50, 0.3, 0.5, 5.3, 'crema'),

  // ── Frutas ──────────────────────────────────────────────────────────
  F('banano', 'frutas', '🍌', 'Banano', '1 mediano (118 g)', 105, 1.3, 27, 0.4, 'guineo'),
  F('manzana', 'frutas', '🍎', 'Manzana', '1 mediana (180 g)', 95, 0.5, 25, 0.3, ''),
  F('naranja', 'frutas', '🍊', 'Naranja', '1 mediana (130 g)', 62, 1.2, 15.4, 0.2, ''),
  F('mandarina', 'frutas', '🍊', 'Mandarina', '1 unidad (90 g)', 48, 0.7, 12, 0.3, ''),
  F('mango', 'frutas', '🥭', 'Mango', '1 taza en trozos (165 g)', 99, 1.4, 25, 0.6, ''),
  F('papaya', 'frutas', '🍈', 'Papaya', '1 taza (145 g)', 62, 0.7, 15.7, 0.4, ''),
  F('pina', 'frutas', '🍍', 'Piña', '1 taza (165 g)', 82, 0.9, 21.6, 0.2, ''),
  F('fresas', 'frutas', '🍓', 'Fresas', '1 taza (150 g)', 48, 1, 11.5, 0.5, 'fresa'),
  F('guayaba', 'frutas', '🍐', 'Guayaba', '1 unidad (55 g)', 37, 1.4, 7.9, 0.5, ''),
  F('uvas', 'frutas', '🍇', 'Uvas', '1 taza (150 g)', 104, 1.1, 27, 0.2, 'uva'),
  F('patilla', 'frutas', '🍉', 'Patilla (sandía)', '1 taza (150 g)', 46, 0.9, 11.5, 0.2, 'sandia'),
  F('melon', 'frutas', '🍈', 'Melón', '1 taza (160 g)', 54, 1.3, 13, 0.3, ''),
  F('pera', 'frutas', '🍐', 'Pera', '1 mediana (178 g)', 101, 0.6, 27, 0.3, ''),
  F('aguacate', 'frutas', '🥑', 'Aguacate', '2 tajadas (70 g)', 112, 1.4, 6, 10.3, 'palta'),
  F('moras', 'frutas', '🫐', 'Moras', '1 taza (145 g)', 62, 2, 14, 0.7, 'mora'),
  F('granadilla', 'frutas', '🟠', 'Granadilla', '1 unidad', 55, 1.3, 12, 0.4, ''),
  F('maracuya', 'frutas', '🟣', 'Maracuyá (pulpa)', '1 unidad (30 g)', 29, 0.7, 7, 0.2, ''),
  F('lulo', 'frutas', '🟠', 'Lulo', '1 unidad', 15, 0.3, 3.5, 0.1, ''),
  F('pitahaya', 'frutas', '🐉', 'Pitahaya amarilla', '1 unidad (120 g de pulpa)', 60, 0.6, 15, 0.2, ''),
  F('ensalada-frutas', 'frutas', '🍧', 'Ensalada de frutas con crema y queso', '1 porción (300 g)', 400, 8, 60, 14, 'frutas'),
  F('salpicon', 'frutas', '🍹', 'Salpicón de frutas', '1 vaso (300 ml)', 180, 1, 45, 0.3, 'frutas'),

  // ── Verduras ────────────────────────────────────────────────────────
  F('ensalada', 'verduras', '🥗', 'Ensalada verde (lechuga, tomate, cebolla)', '1 plato (150 g)', 30, 1.5, 6, 0.3, 'lechuga'),
  F('tomate', 'verduras', '🍅', 'Tomate', '1 mediano (120 g)', 22, 1.1, 4.7, 0.2, ''),
  F('zanahoria', 'verduras', '🥕', 'Zanahoria', '1 mediana (60 g)', 25, 0.6, 6, 0.1, ''),
  F('brocoli', 'verduras', '🥦', 'Brócoli cocido', '1 taza (155 g)', 55, 3.7, 11, 0.6, ''),
  F('ahuyama', 'verduras', '🎃', 'Ahuyama cocida', '1 porción (150 g)', 45, 1.2, 11, 0.2, 'auyama calabaza zapallo'),
  F('habichuela', 'verduras', '🫛', 'Habichuelas cocidas', '1 taza (125 g)', 44, 2.4, 10, 0.4, ''),
  F('pepino', 'verduras', '🥒', 'Pepino', '1 taza (120 g)', 18, 0.8, 4.4, 0.1, ''),
  F('verduras-salteadas', 'verduras', '🥘', 'Verduras salteadas', '1 taza (150 g)', 90, 2.5, 10, 4.5, ''),
  F('hogao', 'verduras', '🍅', 'Hogao', '2 cucharadas (30 g)', 40, 0.4, 3, 3, 'guiso'),
  F('guacamole', 'verduras', '🥑', 'Guacamole', '3 cucharadas (50 g)', 80, 1, 4.5, 7, ''),

  // ── Platos típicos ──────────────────────────────────────────────────
  F('bandeja-paisa', 'platos', '🍛', 'Bandeja paisa completa', '1 plato', 1450, 70, 130, 72, 'bandeja'),
  F('sancocho', 'platos', '🍲', 'Sancocho de gallina o res', '1 plato (500 ml)', 450, 30, 45, 16, 'sopa'),
  F('ajiaco', 'platos', '🍲', 'Ajiaco con pollo, crema y alcaparras', '1 plato (450 ml)', 490, 30, 50, 18, 'sopa'),
  F('mondongo', 'platos', '🍲', 'Mondongo', '1 plato (450 ml)', 450, 28, 35, 21, 'sopa'),
  F('caldo-costilla', 'platos', '🍲', 'Caldo de costilla', '1 plato (400 ml)', 300, 20, 20, 15, 'caldo sopa'),
  F('sopa-verduras', 'platos', '🍲', 'Sopa de verduras', '1 plato (350 ml)', 120, 4, 18, 3.5, 'sopa'),
  F('crema-verduras', 'platos', '🥣', 'Crema de verduras o ahuyama', '1 plato (300 ml)', 160, 4, 18, 8, 'sopa crema'),
  F('changua', 'platos', '🥣', 'Changua', '1 plato', 250, 14, 15, 14.5, ''),
  F('tamal', 'platos', '🫔', 'Tamal tolimense', '1 unidad (400 g)', 650, 25, 60, 35, ''),
  F('lechona', 'platos', '🐖', 'Lechona', '1 porción (250 g)', 600, 30, 45, 33, ''),
  F('arroz-pollo', 'platos', '🍛', 'Arroz con pollo', '1 plato (300 g)', 480, 25, 60, 15, 'arroz'),
  F('calentado', 'platos', '🍛', 'Calentado con huevo', '1 plato', 650, 22, 85, 24, ''),
  F('almuerzo-corriente', 'platos', '🍛', 'Almuerzo corriente (sopa, seco y jugo)', '1 almuerzo', 1000, 45, 130, 32, 'corrientazo ejecutivo menu del dia'),
  F('carne-sudada', 'platos', '🍲', 'Carne sudada con papa', '1 porción (250 g)', 375, 30, 22, 18, 'sudado'),
  F('sobrebarriga', 'platos', '🥩', 'Sobrebarriga en salsa', '1 porción (150 g)', 340, 30, 5, 22, 'carne'),
  F('arroz-chino', 'platos', '🍛', 'Arroz chino o arroz frito', '1 plato (350 g)', 600, 20, 85, 20, 'arroz'),
  F('cazuela-mariscos', 'platos', '🦐', 'Cazuela de mariscos', '1 plato', 550, 35, 25, 34, 'mariscos'),
  F('pasta-bolonesa', 'platos', '🍝', 'Pasta con salsa boloñesa', '1 plato (300 g)', 450, 22, 60, 13, 'espagueti'),
  F('lasana', 'platos', '🍝', 'Lasaña', '1 porción (250 g)', 400, 22, 35, 19, 'lasagna'),

  // ── Comida rápida ───────────────────────────────────────────────────
  F('empanada', 'rapidas', '🥟', 'Empanada de carne frita', '1 mediana (90 g)', 220, 6, 22, 12, 'empanadas'),
  F('papa-rellena', 'rapidas', '🥔', 'Papa rellena', '1 unidad (150 g)', 300, 9, 32, 15, ''),
  F('arepa-huevo', 'rapidas', '🫓', 'Arepa de huevo', '1 unidad (150 g)', 370, 12, 35, 20, 'arepa'),
  F('perro', 'rapidas', '🌭', 'Perro caliente con salsas y papitas', '1 unidad', 500, 15, 50, 26, 'hot dog'),
  F('hamburguesa', 'rapidas', '🍔', 'Hamburguesa sencilla', '1 unidad', 550, 28, 45, 28, ''),
  F('pizza', 'rapidas', '🍕', 'Pizza (queso o hawaiana)', '1 porción mediana (110 g)', 285, 12, 36, 10.5, ''),
  F('salchipapa', 'rapidas', '🍟', 'Salchipapa', '1 porción personal', 800, 20, 70, 48, ''),
  F('pincho', 'rapidas', '🍢', 'Pincho de carne o pollo', '1 unidad (120 g)', 260, 25, 6, 15, 'chuzo'),
  F('sandwich', 'rapidas', '🥪', 'Sándwich de jamón y queso', '1 unidad', 330, 17, 30, 15.5, 'sanduche'),
  F('burrito', 'rapidas', '🌯', 'Burrito', '1 unidad', 650, 30, 70, 26, ''),
  F('combo-pollo', 'rapidas', '🍗', 'Pollo asado ¼ con papa y arepa', '1 combo', 750, 45, 50, 40, 'pollo'),
  F('desgranado', 'rapidas', '🌽', 'Mazorca desgranada', '1 porción', 900, 40, 70, 50, 'desgranado'),
  F('alitas', 'rapidas', '🍗', 'Alitas de pollo', '6 unidades', 540, 40, 12, 37, 'alas pollo'),
  F('sushi', 'rapidas', '🍣', 'Sushi', '8 piezas', 350, 12, 55, 8, ''),

  // ── Bebidas ─────────────────────────────────────────────────────────
  F('tinto', 'bebidas', '☕', 'Tinto sin azúcar', '1 pocillo (120 ml)', 2, 0.1, 0, 0, 'cafe negro'),
  F('tinto-azucar', 'bebidas', '☕', 'Tinto con azúcar o panela', '1 pocillo (120 ml)', 35, 0.1, 8.5, 0, 'cafe'),
  F('cafe-leche', 'bebidas', '☕', 'Café con leche y azúcar', '1 taza (240 ml)', 110, 4, 14, 4, 'cafe perico'),
  F('chocolate', 'bebidas', '🍫', 'Chocolate en leche', '1 taza (240 ml)', 250, 9, 30, 11, 'chocolate caliente'),
  F('aguapanela', 'bebidas', '🍵', 'Aguapanela', '1 vaso (240 ml)', 100, 0, 26, 0, 'agua de panela'),
  F('jugo-agua', 'bebidas', '🧃', 'Jugo natural en agua con azúcar', '1 vaso (300 ml)', 110, 0.5, 27, 0.1, 'jugo'),
  F('jugo-sin-azucar', 'bebidas', '🧃', 'Jugo natural en agua sin azúcar', '1 vaso (300 ml)', 45, 0.5, 10.5, 0.1, 'jugo'),
  F('jugo-leche', 'bebidas', '🥤', 'Jugo en leche con azúcar', '1 vaso (300 ml)', 210, 6, 34, 5.5, 'jugo'),
  F('jugo-naranja', 'bebidas', '🍊', 'Jugo de naranja natural', '1 vaso (240 ml)', 112, 1.7, 26, 0.5, 'jugo'),
  F('limonada', 'bebidas', '🍋', 'Limonada con azúcar', '1 vaso (300 ml)', 100, 0.2, 26, 0, ''),
  F('limonada-coco', 'bebidas', '🥥', 'Limonada de coco', '1 vaso (300 ml)', 300, 2, 40, 15, 'limonada'),
  F('avena-bebida', 'bebidas', '🥛', 'Avena en leche (bebida)', '1 vaso (240 ml)', 220, 7, 34, 6, 'avena'),
  F('gaseosa', 'bebidas', '🥤', 'Gaseosa', '1 botella personal (400 ml)', 165, 0, 41, 0, 'coca cola refresco soda'),
  F('gaseosa-cero', 'bebidas', '🥤', 'Gaseosa cero o light', '1 botella (400 ml)', 2, 0, 0.3, 0, 'zero dieta refresco'),
  F('te-frio', 'bebidas', '🧋', 'Té frío embotellado', '1 botella (400 ml)', 120, 0, 30, 0, 'te'),
  F('hidratante', 'bebidas', '🥤', 'Bebida hidratante deportiva', '1 botella (500 ml)', 120, 0, 30, 0, 'suero'),
  F('energizante', 'bebidas', '⚡', 'Bebida energizante', '1 lata (250 ml)', 112, 0, 28, 0, 'energy'),
  F('malteada', 'bebidas', '🥤', 'Malteada', '1 vaso (350 ml)', 500, 12, 70, 19, 'batido'),
  F('proteina', 'bebidas', '💪', 'Batido de proteína en agua', '1 scoop (30 g)', 120, 24, 3, 1.5, 'whey proteina'),
  F('cerveza', 'bebidas', '🍺', 'Cerveza', '1 lata o botella (330 ml)', 140, 1.2, 11, 0, 'pola'),
  F('aguardiente', 'bebidas', '🥃', 'Aguardiente', '1 trago (30 ml)', 70, 0, 3, 0, 'guaro'),
  F('ron', 'bebidas', '🥃', 'Ron o whisky', '1 trago (30 ml)', 65, 0, 0, 0, 'whisky'),
  F('vino', 'bebidas', '🍷', 'Vino', '1 copa (150 ml)', 125, 0.1, 4, 0, ''),

  // ── Mecato y postres ────────────────────────────────────────────────
  F('mani', 'snacks', '🥜', 'Maní', '1 puñado (28 g)', 165, 7.3, 4.6, 14, 'mani'),
  F('almendras', 'snacks', '🌰', 'Almendras', '1 puñado (28 g)', 164, 6, 6, 14, 'nueces'),
  F('papas-paquete', 'snacks', '🥔', 'Papas fritas de paquete', '1 paquete personal (30 g)', 160, 2, 15, 10.5, 'papitas chips'),
  F('platanitos', 'snacks', '🍌', 'Platanitos de paquete', '1 paquete (30 g)', 155, 0.7, 18, 9, ''),
  F('chocolatina', 'snacks', '🍫', 'Chocolatina pequeña', '1 unidad (12 g)', 65, 0.8, 7, 3.7, 'chocolate'),
  F('barra-chocolate', 'snacks', '🍫', 'Barra de chocolate', '1 barra (40 g)', 210, 3, 24, 12, 'chocolate'),
  F('galletas-dulces', 'snacks', '🍪', 'Galletas dulces o de crema', '4 galletas (36 g)', 175, 1.8, 25, 7.5, 'galletas'),
  F('galleta-avena', 'snacks', '🍪', 'Galleta de avena', '1 unidad (25 g)', 110, 1.6, 17, 4, 'galletas'),
  F('barra-cereal', 'snacks', '🍫', 'Barra de cereal', '1 unidad (25 g)', 100, 1.5, 18, 2.5, 'barrita'),
  F('helado', 'snacks', '🍨', 'Helado', '1 bola (70 g)', 145, 2.5, 17, 7.5, ''),
  F('gelatina', 'snacks', '🍮', 'Gelatina con azúcar', '1 porción (120 g)', 75, 1.5, 17, 0, ''),
  F('torta', 'snacks', '🍰', 'Torta o ponqué', '1 porción (80 g)', 300, 4, 42, 13, 'ponque pastel bizcocho'),
  F('brownie', 'snacks', '🍫', 'Brownie', '1 unidad (60 g)', 260, 3, 34, 13, ''),
  F('dona', 'snacks', '🍩', 'Dona', '1 unidad (60 g)', 250, 3.5, 29, 13.5, 'donut'),
  F('oblea', 'snacks', '🧇', 'Oblea con arequipe', '1 unidad', 180, 3, 32, 4.5, 'obleas'),
  F('bocadillo', 'snacks', '🟥', 'Bocadillo de guayaba', '1 unidad (30 g)', 90, 0.2, 22, 0, ''),
  F('arroz-leche', 'snacks', '🍮', 'Arroz con leche', '1 porción (150 g)', 210, 5, 35, 5.5, ''),
  F('arequipe', 'snacks', '🍯', 'Arequipe', '1 cucharada (20 g)', 63, 1.4, 11, 1.5, 'dulce de leche'),
  F('crispetas', 'snacks', '🍿', 'Crispetas con mantequilla', '1 porción (40 g)', 200, 3.5, 22, 11, 'palomitas popcorn'),

  // ── Grasas, salsas y endulzantes ────────────────────────────────────
  F('aceite', 'grasas', '🫒', 'Aceite (girasol, oliva…)', '1 cucharada (14 g)', 120, 0, 0, 14, 'oliva'),
  F('mantequilla', 'grasas', '🧈', 'Mantequilla o margarina', '1 cucharadita (5 g)', 36, 0, 0, 4.1, 'margarina'),
  F('mayonesa', 'grasas', '🥚', 'Mayonesa', '1 cucharada (14 g)', 95, 0.1, 0.1, 10.3, 'mayo'),
  F('salsa-tomate', 'grasas', '🍅', 'Salsa de tomate', '1 cucharada (17 g)', 18, 0.2, 4.5, 0, 'ketchup'),
  F('salsa-rosada', 'grasas', '🥫', 'Salsa rosada', '1 cucharada (15 g)', 70, 0, 2, 7, ''),
  F('vinagreta', 'grasas', '🥗', 'Aderezo o vinagreta', '1 cucharada (15 g)', 70, 0, 1.5, 7, 'aderezo'),
  F('azucar', 'grasas', '🍬', 'Azúcar', '1 cucharadita (4 g)', 16, 0, 4, 0, ''),
  F('panela', 'grasas', '🟫', 'Panela', '1 trozo (20 g)', 75, 0, 19, 0, ''),
  F('miel', 'grasas', '🍯', 'Miel', '1 cucharada (21 g)', 64, 0, 17, 0, ''),
  F('mantequilla-mani', 'grasas', '🥜', 'Mantequilla de maní', '1 cucharada (16 g)', 95, 3.5, 3.5, 8, 'crema de mani'),
];

export const POPULAR = [
  'arepa-blanca', 'huevo-frito', 'huevos-pericos', 'arroz-blanco', 'pechuga', 'frijoles', 'carne-asada',
  'maduro-frito', 'ensalada', 'tinto-azucar', 'cafe-leche', 'chocolate', 'pan-blanco', 'queso-campesino',
  'banano', 'jugo-agua', 'almuerzo-corriente', 'empanada', 'gaseosa',
];

const BY_ID = new Map(FOODS.map((f) => [f.id, f]));
export const foodById = (id) => BY_ID.get(id);

// Opciones "por defecto" cuando la búsqueda es genérica (ej. "arroz" → arroz blanco)
const BOOST = new Set([
  ...POPULAR, 'papa-cocida', 'pollo-asado', 'leche-semi', 'yogur', 'aguapanela', 'pizza', 'hamburguesa',
  'papas-francesa', 'galletas-dulces', 'cerveza', 'sopa-verduras', 'jugo-naranja', 'manzana', 'atun-agua',
]);

// ── Búsqueda ─────────────────────────────────────────────────────────
const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'en', 'al', 'a', 'y', 'o', 'con', 'para', 'por', 'mi', 'me', 'lo']);
const singular = (t) => (t.length > 3 ? t.replace(/(es|s)$/, '') : t);

function indexOf(f) {
  if (!f._idx) {
    const name = norm(f.n);
    const toks = norm(`${f.n} ${f.a || ''}`).split(' ').filter(Boolean);
    Object.defineProperty(f, '_idx', { value: { name, toks }, enumerable: false });
  }
  return f._idx;
}

function tokenHit(toks, t) {
  const st = singular(t);
  return toks.some(
    (w) => w.startsWith(t) || (st.length >= 3 && singular(w) === st) || (w.startsWith(st) && w.length - st.length <= 1)
  );
}

export function searchFoods(query, extra = [], limit = 40) {
  const qn = norm(query);
  if (!qn) return [];
  const raw = qn.split(' ');
  const qt = raw.filter((t) => t && !STOP.has(t));
  if (!qt.length) return [];
  const wantsSin = raw.includes('sin');
  const wantsCon = raw.includes('con');
  const pool = [...extra, ...FOODS];
  const strict = [];
  const loose = [];
  for (const f of pool) {
    const { name, toks } = indexOf(f);
    let hits = 0;
    for (const t of qt) if (tokenHit(toks, t)) hits++;
    if (!hits) continue;
    let score = hits / qt.length;
    if (name.startsWith(qt.join(' '))) score += 1.2;
    else if (name.startsWith(qt[0]) || name.startsWith(singular(qt[0]))) score += 1;
    if (BOOST.has(f.id)) score += 0.6;
    if (f.cat === 'mios') score += 0.5;
    const nameToks = name.split(' ');
    if (nameToks.includes('sin') && !wantsSin) score -= 0.6;
    if (wantsCon && nameToks.includes('con')) score += 0.2;
    score -= name.length / 200;
    (hits === qt.length ? strict : loose).push({ f, score });
  }
  const list = strict.length ? strict : loose.filter((x) => x.score >= 0.5);
  return list.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.f);
}

// ── Estimación local de un texto ("2 arepas con queso y un tinto") ──
const NUMW = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, medio: 0.5, media: 0.5, mitad: 0.5, doble: 2, par: 2 };
const UNIT = /^(tazas?|vasos?|platos?|porcion(?:es)?|tajadas?|unidades?|cucharadas?|cucharaditas?|pocillos?|latas?|botellas?|pedazos?|trozos?|presas?|filetes?|bolas?|paquetes?|piezas?|copas?|tragos?|punados?)\s+(?:de\s+)?/;
const COUNT = new Set(['unidad', 'pieza', 'presa']);

function parseQty(s) {
  if (s === '½') return 0.5;
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    return b ? a / b : 1;
  }
  return Number(s.replace(',', '.')) || 1;
}

export function localEstimate(text, extra = []) {
  const prepared = String(text || '')
    .replace(/(\d+)\s+y\s+medi[oa]/gi, (_, n) => `${n}.5`)
    .replace(/\buno?a?\s+y\s+medi[oa]/gi, '1.5');
  const chunks = prepared
    .split(/,|;|\n|\+|\s+y\s+|\s+e\s+|\s+m[aá]s\s+|\s+tambi[eé]n\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [];
  for (const chunk of chunks) {
    let s = norm(chunk);
    let q = 1;
    const m = s.match(/^(\d+(?:[.,]\d+)?|½|\d+\/\d+)\s*(.*)$/);
    if (m) {
      q = parseQty(m[1]);
      s = m[2];
    } else {
      const [w, ...rest] = s.split(' ');
      if (NUMW[w] !== undefined) {
        q = NUMW[w];
        s = rest.join(' ');
      }
    }
    let qUnit = null;
    const um = s.match(UNIT);
    if (um) {
      qUnit = singular(um[1]);
      s = s.slice(um[0].length);
    }
    s = s.replace(/^(de|del)\s+/, '').trim();
    if (!s) continue;
    const cands = searchFoods(s, extra, 5);
    let found = cands[0] || null;
    // Si dijo la unidad ("2 cucharadas de avena"), prefiere el alimento medido así
    if (qUnit && cands.length > 1) {
      const byUnit = cands.find((f) => norm(f.u).split(' ').some((w) => singular(w) === qUnit));
      if (byUnit) found = byUnit;
    }
    // "2 huevos pericos" cuando la porción ya es "2 huevos" → 1 porción
    if (found) {
      const pm = norm(found.u).match(/^(\d+)\s+([a-z]+)/);
      const N = pm ? Number(pm[1]) : 1;
      if (N > 1 && (!qUnit || qUnit === singular(pm[2]) || COUNT.has(qUnit))) q = q / N;
    }
    out.push({ food: found, q: Math.round(q * 100) / 100, query: chunk });
  }
  return out;
}

export function emojiFor(name) {
  const f = searchFoods(name, [], 1)[0];
  return f ? f.e : '🍽️';
}
