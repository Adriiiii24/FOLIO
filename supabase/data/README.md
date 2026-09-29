# Datos de referencia

## `ciqual-2025-es.csv`: alimentos genéricos

Macronutrientes por 100 g de 3.181 alimentos genéricos, para el autocompletado de `05 // NUTRICIÓN`.

**Fuente:** Anses. 2025. Table de composition nutritionnelle des aliments Ciqual. Versión en inglés del 2025-11-03 (`Table Ciqual 2025_ENG_2025_11_03.xlsx`), publicada en [ciqual.anses.fr](https://ciqual.anses.fr/).

**Licencia:** [Licence Ouverte / Open Licence 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence/), compatible con CC-BY 2.0. Permite reutilizar, modificar y redistribuir los datos si se cita la fuente y la fecha de la última actualización.

**Modificaciones respecto al original:**

- **Traducción.** Los nombres están traducidos al español para FOLIO; la columna `name_en` guarda el original. Las categorías son los subgrupos de CIQUAL traducidos.
- **Filtros.** De los 3.484 alimentos se descartan los que no tienen los cuatro valores (kcal, proteína, carbohidratos y grasa), la alimentación infantil, las aguas, los alimentos muestreados en territorios de ultramar y las entradas marcadas como archivadas.
- **Alias.** La columna `aliases` añade términos de búsqueda que no se muestran, para nombres de uso común en España que CIQUAL no recoge («macarrones» en la pasta, «jamón york» en el jamón cocido). No incluye marcas.
- **Valores.** Los valores por debajo del límite de detección (`< 0,2`, `< 0,5`…) y las trazas se guardan como 0. El resto se copia tal cual. No se ha estimado ningún valor ausente.

**Columnas:**

| Columna                         | Contenido                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ciqual_code`                   | Código del alimento en CIQUAL (`alim_code`). Es la clave primaria de `public.foods`                                                                    |
| `name`                          | Nombre en español                                                                                                                                      |
| `category`                      | Subgrupo de CIQUAL, en español                                                                                                                         |
| `kcal`                          | Energía según el Reglamento (UE) 1169/2011, por 100 g. Incluye la fibra (2 kcal/g) y el alcohol (7 kcal/g), así que puede no cuadrar con Atwater 4/4/9 |
| `protein_g`, `carbs_g`, `fat_g` | Gramos por 100 g. `carbs_g` son los carbohidratos disponibles, sin la fibra                                                                            |
| `aliases`                       | Términos de búsqueda separados por espacios; vacío en la mayoría                                                                                       |
| `name_en`                       | Nombre original en inglés, para revisar la traducción                                                                                                  |

**Cambios.** El CSV es la fuente de verdad. La migración que carga los datos se genera a partir de él:

```bash
node scripts/build-foods-migration.mts
```

La migración ya aplicada no se vuelve a ejecutar. Para corregir datos después, crea una migración nueva con los `update` correspondientes.
