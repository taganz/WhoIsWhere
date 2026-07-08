-- Datos de prueba: 3 personajes históricos con 5-6 hechos cada uno.
-- Ejecutar después de schema.sql.

insert into ciudades (nombre, lat, lon) values
('Génova', 44.4056, 8.9463),
('Lisboa', 38.7223, -9.1393),
('Palos de la Frontera', 37.2258, -6.8933),
('San Salvador (Bahamas)', 24.0223, -74.5354),
('Barcelona', 41.3874, 2.1686),
('Valladolid', 41.6523, -4.7245),
('Varsovia', 52.2297, 21.0122),
('París', 48.8566, 2.3522),
('Estocolmo', 59.3293, 18.0686),
('Nueva York', 40.7128, -74.0060),
('Vinci', 43.7833, 10.9167),
('Florencia', 43.7696, 11.2558),
('Milán', 45.4642, 9.1900),
('Roma', 41.9028, 12.4964),
('Amboise', 47.4133, 0.9836);

insert into personajes (nombre, nombres_alternativos) values
('Cristóbal Colón', array['Colón','Cristobal Colon','Christopher Columbus','Cristoforo Colombo']),
('Marie Curie', array['Marie Curie','Maria Sklodowska','Marie Sklodowska-Curie','Madame Curie']),
('Leonardo da Vinci', array['Leonardo','Da Vinci','Leonardo Da Vinci']);

insert into hechos (personaje_id, ciudad_id, anio, actividad, orden)
select p.id, c.id, v.anio, v.actividad, v.orden
from (values
  ('Cristóbal Colón','Génova',1451,'Nace en el seno de una familia de tejedores',1),
  ('Cristóbal Colón','Lisboa',1477,'Se instala y aprende náutica y cartografía',2),
  ('Cristóbal Colón','Palos de la Frontera',1492,'Zarpa hacia las Indias con la Niña, la Pinta y la Santa María',3),
  ('Cristóbal Colón','San Salvador (Bahamas)',1492,'Llega a tierra tras cruzar el Atlántico',4),
  ('Cristóbal Colón','Barcelona',1493,'Es recibido por los Reyes Católicos tras su primer viaje',5),
  ('Cristóbal Colón','Valladolid',1506,'Muere sin saber que había llegado a un nuevo continente',6),

  ('Marie Curie','Varsovia',1867,'Nace y crece en la Polonia bajo dominio ruso',1),
  ('Marie Curie','París',1891,'Se traslada a estudiar Física y Matemáticas en la Sorbona',2),
  ('Marie Curie','Estocolmo',1903,'Recibe el Premio Nobel de Física junto a Pierre Curie y Henri Becquerel',3),
  ('Marie Curie','Nueva York',1921,'Realiza una gira por Estados Unidos y recibe un gramo de radio',4),
  ('Marie Curie','París',1934,'Muere en Passy a causa de una anemia aplásica',5),

  ('Leonardo da Vinci','Vinci',1452,'Nace cerca de Florencia, hijo de un notario',1),
  ('Leonardo da Vinci','Florencia',1466,'Entra como aprendiz en el taller de Verrocchio',2),
  ('Leonardo da Vinci','Milán',1482,'Se pone al servicio de Ludovico Sforza y pinta "La Última Cena"',3),
  ('Leonardo da Vinci','Roma',1513,'Trabaja para la familia Médici en el Vaticano',4),
  ('Leonardo da Vinci','Amboise',1516,'Se traslada a Francia invitado por el rey Francisco I',5),
  ('Leonardo da Vinci','Amboise',1519,'Muere en el castillo de Cloux, cerca de Amboise',6)
) as v(personaje, ciudad, anio, actividad, orden)
join personajes p on p.nombre = v.personaje
join ciudades  c on c.nombre = v.ciudad;
