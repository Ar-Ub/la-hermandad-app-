/**
 * Respaldo automático de La Hermandad F.C. en Google Sheets.
 *
 * QUÉ HACE
 * Recibe los datos que la app guarda en Supabase y los escribe en este
 * mismo Google Sheet, en una pestaña por tabla (se crean solas la primera
 * vez). Además mantiene una pestaña especial "Ficha_Jugadores" con un
 * resumen completo por jugador, para buscar un jugador y ver todo su
 * historial en un solo lugar.
 *
 * CÓMO INSTALARLO (una sola vez)
 * 1. Crea un Google Sheet nuevo y vacío (el que quieras usar de respaldo).
 * 2. Extensiones > Apps Script.
 * 3. Borra el contenido de Code.gs que aparece por defecto y pega TODO
 *    este archivo en su lugar.
 * 4. Arriba a la izquierda, en el menú de Project Settings (el ícono de
 *    engranaje) > Script Properties > Add script property:
 *      nombre: TOKEN
 *      valor: inventa una clave larga y difícil de adivinar (cualquier
 *      texto sirve, por ejemplo una contraseña larga al azar)
 * 5. Deploy > New deployment > tipo "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Copia la URL que te da (termina en /exec).
 * 6. Esa URL + el TOKEN del paso 4 son los dos valores que le pegas a
 *    Claude para conectarlos con la app.
 */

function doPost(e) {
  var props = PropertiesService.getScriptProperties()
  var tokenEsperado = props.getProperty('TOKEN')

  var body
  try {
    body = JSON.parse(e.postData.contents)
  } catch (err) {
    return responder({ ok: false, error: 'JSON inválido' })
  }

  if (!tokenEsperado || body.token !== tokenEsperado) {
    return responder({ ok: false, error: 'Token inválido' })
  }

  try {
    if (body.accion === 'upsert') {
      upsertFila(body.tabla, body.datos)
    } else if (body.accion === 'eliminar') {
      eliminarFila(body.tabla, body.id)
    } else if (body.accion === 'reemplazar_todo') {
      reemplazarTodo(body.tabla, body.filas)
    } else {
      return responder({ ok: false, error: 'Acción desconocida: ' + body.accion })
    }
  } catch (err) {
    return responder({ ok: false, error: String(err) })
  }

  return responder({ ok: true })
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function obtenerOCrearHoja(nombreTabla, columnas) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var hoja = ss.getSheetByName(nombreTabla)
  if (!hoja) {
    hoja = ss.insertSheet(nombreTabla)
    hoja.appendRow(columnas)
    hoja.setFrozenRows(1)
    return hoja
  }
  // Si aparecen columnas nuevas que la hoja todavía no tiene, se agregan
  // al final sin tocar las que ya existen.
  var encabezados = hoja.getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 1)).getValues()[0]
  var faltantes = columnas.filter(function (c) {
    return encabezados.indexOf(c) === -1
  })
  if (faltantes.length) {
    hoja.getRange(1, encabezados.length + 1, 1, faltantes.length).setValues([faltantes])
  }
  return hoja
}

function upsertFila(nombreTabla, datos) {
  if (!datos || !datos.id) throw new Error('Falta "id" en los datos para ' + nombreTabla)
  var columnas = Object.keys(datos)
  var hoja = obtenerOCrearHoja(nombreTabla, columnas)
  var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]

  var idColIndex = encabezados.indexOf('id')
  var filaExistente = -1
  if (hoja.getLastRow() > 1) {
    var idsColumna = hoja.getRange(2, idColIndex + 1, hoja.getLastRow() - 1, 1).getValues()
    for (var i = 0; i < idsColumna.length; i++) {
      if (String(idsColumna[i][0]) === String(datos.id)) {
        filaExistente = i + 2 // +2: fila 1 es encabezado, base 1
        break
      }
    }
  }

  var fila = encabezados.map(function (col) {
    var v = datos[col]
    if (v == null) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    return v
  })

  if (filaExistente > 0) {
    hoja.getRange(filaExistente, 1, 1, fila.length).setValues([fila])
  } else {
    hoja.appendRow(fila)
  }
}

function eliminarFila(nombreTabla, id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var hoja = ss.getSheetByName(nombreTabla)
  if (!hoja || hoja.getLastRow() < 2) return
  var idsColumna = hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues()
  for (var i = 0; i < idsColumna.length; i++) {
    if (String(idsColumna[i][0]) === String(id)) {
      hoja.deleteRow(i + 2)
      return
    }
  }
}

function reemplazarTodo(nombreTabla, filas) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var hoja = ss.getSheetByName(nombreTabla)
  if (!filas || !filas.length) {
    if (hoja && hoja.getLastRow() > 1) hoja.deleteRows(2, hoja.getLastRow() - 1)
    return
  }
  var columnas = Object.keys(filas[0])
  if (!hoja) {
    hoja = ss.insertSheet(nombreTabla)
    hoja.appendRow(columnas)
    hoja.setFrozenRows(1)
  } else {
    if (hoja.getLastRow() > 1) hoja.deleteRows(2, hoja.getLastRow() - 1)
    hoja.getRange(1, 1, 1, columnas.length).setValues([columnas])
    if (hoja.getLastColumn() > columnas.length) {
      hoja.deleteColumns(columnas.length + 1, hoja.getLastColumn() - columnas.length)
    }
  }
  var valores = filas.map(function (fila) {
    return columnas.map(function (col) {
      var v = fila[col]
      if (v == null) return ''
      if (typeof v === 'object') return JSON.stringify(v)
      return v
    })
  })
  hoja.getRange(2, 1, valores.length, columnas.length).setValues(valores)
}
