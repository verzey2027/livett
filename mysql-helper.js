// MySQL Query Helper - แปลง PostgreSQL syntax เป็น MySQL

// แปลง parameterized query จาก $1, $2 เป็น ?
function convertQuery(query, params) {
  let mysqlQuery = query
  let paramIndex = 1
  
  // แปลง $1, $2, ... เป็น ?
  while (mysqlQuery.includes(`$${paramIndex}`)) {
    mysqlQuery = mysqlQuery.replace(`$${paramIndex}`, '?')
    paramIndex++
  }
  
  // แปลง RETURNING เป็น MySQL style
  mysqlQuery = mysqlQuery.replace(/RETURNING\s+[\w\s,]+$/i, '')
  
  return { query: mysqlQuery, params }
}

// Wrapper สำหรับ pool.query ที่รองรับทั้ง PostgreSQL และ MySQL style
async function query(pool, sqlQuery, params = []) {
  const { query: mysqlQuery, params: mysqlParams } = convertQuery(sqlQuery, params)
  const [rows] = await pool.query(mysqlQuery, mysqlParams)
  
  // MySQL ส่งผลลัพธ์ต่างจาก PostgreSQL
  // ถ้าเป็น INSERT/UPDATE ให้ดึงข้อมูลที่เพิ่งสร้าง
  if (sqlQuery.toUpperCase().includes('INSERT') && sqlQuery.toUpperCase().includes('RETURNING')) {
    if (rows.insertId) {
      // ดึงข้อมูลที่เพิ่งสร้าง
      const [newRows] = await pool.query(
        'SELECT * FROM users WHERE id = ?',
        [rows.insertId]
      )
      return { rows: newRows }
    }
  }
  
  return { rows: Array.isArray(rows) ? rows : [rows] }
}

module.exports = { query, convertQuery }
