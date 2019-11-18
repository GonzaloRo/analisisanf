const express = require('express');
const router = express.Router();

const pool = require('../database');


// ********************Rutas Crear Materia Prima *************** */
router.get('/crear_materia_prima', async (req, res) => {
    res.render('materia-prima/crear_materia_prima');
    });

router.post('/crear_materia_prima', async (req, res) => {
    const{ nombre } = req.body;
    const newMateriaPrima = {
        nombre,
        existencias: 0
    };
    await pool.query('INSERT INTO materiasprimas set ?', [newMateriaPrima]);
    req.flash('success', 'Materia Prima Creada');
    res.redirect('/costeo/listar_materia_prima');
    });
        
router.get('/listar_materia_prima', async (req, res) => {
    const materiasprimas = await pool.query('SELECT * FROM materiasprimas');
    res.render('materia-prima/listar_materia_prima', {materiasprimas});
    });


//*******************Rutas Materia Prima******************* */ 
router.get('/entrada_materia_prima_saldo', async (req, res) => {
    const materiasprimas = await pool.query('SELECT * FROM materiasprimas');
    res.render('materia-prima/agregar_materia_prima', {materiasprimas});
    });

router.post('/entrada_materia_prima_saldo', async (req, res) => {
    const { materiaprima_id, cantidad, preciounitario } = req.body;
    const newEntradaMateriaPrima = {
        materiaprima_id,
        cantidad,
        preciounitario,
    }
    await pool.query('INSERT INTO entradamp set ?', [newEntradaMateriaPrima]);
    req.flash('success', 'Link Saved Succesfully');
    res.redirect('/costeo/materia_prima_entrada');
    });

router.get('/materia_prima_saldo', async (req, res) => {
    res.render('materia-prima/listar_saldos_materia_prima');
    });

router.get('/materia_prima_entrada', async (req, res) => {
    res.render('materia-prima/listar_entradas_materia_prima');
    });

router.get('/materia_prima_salida', async (req, res) => {
    res.render('materia-prima/listar_salidas_materia_prima');
    });


//*******************Rutas Producto Terminado***************** */
router.get('/producto_terminado_saldo', async (req, res) => {
    res.render('costeo/listar_saldos_producto_terminado');
    });

router.get('/producto_terminado_entrada', async (req, res) => {
    res.render('costeo/listar_entradas_producto_terminado');
    });

router.get('/producto_terminado_salida', async (req, res) => {
    res.render('costeo/listar_salidas_producto_terminado');
    });

//*******************Rutas Producto en Proceso***************** */  

router.get('/producto_proceso', async (req, res) => {
    var productoproc = await pool.query('SELECT * FROM `invproductosproceso`  ORDER BY id DESC');
    console.log(productoproc);
    res.render('costeo/productos_procesos', {productoproc});
    });
    
router.get('/agregar_productos_proceso',async (req, res) => {
    const materiasPrimas = await pool.query('SELECT * FROM materiasprimas');    
    res.render('costeo/agregar_productos_a_proceso', {materiasPrimas});
    })

router.post('/agregar_productos_proceso',async (req, res) => {
      const {tipoproducto,cantidadrestante,detalle,materiaprimaid,cantidadmatariaprima,
        numeroprocesos}= req.body;      

    const newProducProc ={
        tipoproducto,
        cantidadrestante,
        numeroprocesos,    
    }
    
    
  await pool.query('INSERT INTO invproductosproceso set ?', [newProducProc]);
  var ProductoProc = await pool.query('SELECT * FROM `invproductosproceso`  ORDER BY id DESC');
  
  productoproceso_id= ProductoProc[0].id
  const orden = {
      productoproceso_id,
      detalle
  } 
  
  await pool.query('INSERT INTO orden set ?', [orden]);
  var Arrayorden = await pool.query('SELECT * FROM `orden`  ORDER BY id DESC');
const ordenproceso_id= Arrayorden[0].id;
const materiaPrima = await pool.query('SELECT t1.id FROM `entradamp` t1 INNER JOIN materiasprimas t2 ON t1.materiaprima_id = t2.id where t2.id=?',materiaprimaid);

const materiaprima_id= materiaPrima[0].id;
const numero=1;
const nuevoProceso={
    ordenproceso_id,
    materiaprima_id, 
    numero,
    cantidadmatariaprima,   
}
console.log(nuevoProceso);
await pool.query('INSERT INTO procesos set ?',[nuevoProceso]);

  var productoproc = await pool.query('SELECT * FROM `invproductosproceso`  ORDER BY id DESC');
    req.flash('success', 'Link Saved Succesfully');
    res.render('costeo/productos_procesos', {productoproc});
        });

router.get('/detalle_producto_proceso/:id', async (req, res) => {
    console.log( req.params.id);
    var producto = await pool.query('SELECT * FROM `invproductosproceso`  WHERE id=?',req.params.id);
    var procesos = await pool.query ('SELECT procesos.id, invproductosproceso.cantidadrestante, procesos.numero FROM `procesos` INNER JOIN `orden`  ON (procesos.ordenproceso_id = orden.id) INNER JOIN `invproductosproceso` ON orden.productoproceso_id = invproductosproceso.id WHERE invproductosproceso.id = ?',req.params.id)
    res.render('costeo/detalle_producto_proceso',{producto,procesos});
    });

router.get('/transferir_proceso/:id',async(req, res) => {
    const materiasPrimas = await pool.query('SELECT * FROM materiasprimas');
    var procesos = await pool.query ('SELECT procesos.id, invproductosproceso.cantidadrestante ,procesos.ordenproceso_id, procesos.numero FROM `procesos` INNER JOIN `orden`  ON (procesos.ordenproceso_id = orden.id) INNER JOIN `invproductosproceso` ON orden.productoproceso_id = invproductosproceso.id WHERE procesos.id = ?',req.params.id)
    console.log(procesos);
    res.render('costeo/form_cambiar_proceso_producto',{materiasPrimas,procesos});
});
router.post('/transferir_proceso',async(req, res) => {
    var {ordenproceso_id,numero,materiaprima_id,cantidadmatariaprima,mod,
        cif}= req.body;    
     const   procActual =numero;
      numero=parseInt(numero)+1;
        const nuevoProceso={
            ordenproceso_id,
            materiaprima_id, 
            numero,
            cantidadmatariaprima,   
        }
        console.log(nuevoProceso);
       await pool.query('INSERT INTO procesos set ?',[nuevoProceso]);  
        await pool.query('UPDATE `procesos` SET `costomod`=?,`costocif`=? WHERE (procesos.ordenproceso_id = ? AND procesos.numero = ?)',[mod,cif,ordenproceso_id,procActual]);
    var productoproc = await pool.query('SELECT * FROM `invproductosproceso`  ORDER BY id DESC');
    console.log(productoproc);
    res.render('costeo/productos_procesos', {productoproc});
});

module.exports = router;