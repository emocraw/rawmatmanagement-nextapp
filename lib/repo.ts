import sql from "mssql";
import { getPool, getMachineDatabases } from "@/lib/db";
import { env } from "@/lib/env";

export type ShopfloorUser = {
  user_ID: string;
  name_user: string;
  user_type: string;
};

export type LoginUser = {
  User_ID: string;
  Name_Surname: string;
  machine: string;
  Type: string;
};

export type GradeCInput = {
  processorder: string;
  batch: string;
  matcode: string;
  cqty: number;
  reasonCode: string;
  lineSender: string;
  lineReceiver: string;
  sender: string;
  groupMachine: string;
};

/**
 * ตรวจสอบบัญชีผู้ใช้จาก username/password ในตาราง UserLogin
 * คืนข้อมูลผู้ใช้ที่ใช้ในระบบ shopfloor หากพบตรงเงื่อนไข
 */
export async function findUser(username: string, password: string): Promise<LoginUser | null> {
  const pool = await getPool(env.DB_USER_MANAGEMENT);
  const request = pool.request();
  request.input("username", sql.VarChar(50), username);
  request.input("password", sql.VarChar(100), password);

  const result = await request.query<LoginUser>(`
    SELECT
      [EmployeeCode] [User_ID],
      [LocalName] [Name_Surname],
      [Shop_floor_name] machine,
      IIF(EmployeeCode IN ('15336','3506'), 'System_admin', 'User') AS [Type]
    FROM [dbo].[UserLogin]
    WHERE [EmployeeCode] = @username
      AND CONVERT(varchar, DECRYPTBYPASSPHRASE('KEY', [user_passowrd])) = @password
  `);

  return result.recordset[0] ?? null;
}

/**
 * บันทึก token ใหม่ลงตาราง user_shopfloor ของผู้ใช้ที่ login สำเร็จ
 */
export async function updateUserToken(username: string, token: string): Promise<void> {
  const pool = await getPool(env.DB_USER_MANAGEMENT);
  const request = pool.request();
  request.input("token", sql.VarChar(255), token);
  request.input("username", sql.VarChar(50), username);
  await request.query(`UPDATE [dbo].[user_shopfloor] SET token = @token WHERE user_ID = @username`);
}

/**
 * ค้นหาผู้ใช้จาก token เพื่อตรวจสอบ session และสิทธิ์การใช้งาน
 */
export async function getUserByToken(token: string): Promise<ShopfloorUser[]> {
  const pool = await getPool(env.DB_USER_MANAGEMENT);
  const request = pool.request();
  request.input("token", sql.VarChar(255), token);
  const result = await request.query<ShopfloorUser>(`
    SELECT [user_ID], [name_user], [user_type]
    FROM [dbo].[user_shopfloor]
    WHERE token = @token
  `);
  return result.recordset;
}

/**
 * ดึงข้อมูล QR จากฐานข้อมูลเครื่องจักร
 * - confirmedOnly = true จะดึงเฉพาะรายการที่ statusout = 'Off'
 */
export async function getQr(machine: string, qr: string, confirmedOnly = false): Promise<any[]> {
  if (!getMachineDatabases().includes(machine)) {
    throw new Error("Invalid machine");
  }

  const pool = await getPool(machine);
  const request = pool.request();
  request.input("qr", sql.VarChar(100), qr);

  const condition = confirmedOnly ? " AND statusout = 'Off'" : "";

  const result = await request.query(`
    SELECT TOP (1000)
      [ID],[QR],[Reserve_num],[Departsent],[Slocsent],[Batch],[Matcode],[Reci_qty],
      [Mvt311doc],[Datereci],[Departreci],[Slocreci],[woodgrtime],[palettfactor],[palettsize],
      [definit],[ave_left_thick],[ave_right_thick],[ave_sheet_thick],[statusout],[processorder],
      [outqty],[outdate],[Remain],[returnstat],[returndep],[returndoc],[returndate],
      [userid],[cqty],[creason],[cdepart],[cdate],[user261_id]
    FROM [dbo].[PRDinput]
    WHERE QR = @qr ${condition}
    ORDER BY id DESC
  `);

  return result.recordset;
}

/**
 * อัปเดตสถานะ QR ใน PRDinput ให้เป็นการ confirm ออกงาน (statusout = Off)
 * หาก QR ถูก confirm ไปก่อนแล้วจะไม่อัปเดตซ้ำ
 */
export async function updateStatusQrPrdInput(machine: string, qr: string, processorder: string, user: string): Promise<void> {
  const pool = await getPool(machine);

  const checkReq = pool.request();
  checkReq.input("qr", sql.VarChar(100), qr);
  const checkResult = await checkReq.query<{ statusout: string | null }>(`SELECT statusout FROM [dbo].[PRDinput] WHERE QR = @qr`);
  const row = checkResult.recordset[0];

  if (row?.statusout === "Off") {
    return;
  }

  const updateReq = pool.request();
  updateReq.input("processorder", sql.VarChar(100), processorder);
  updateReq.input("user", sql.VarChar(50), user);
  updateReq.input("statusout", sql.VarChar(10), "Off");
  updateReq.input("qr", sql.VarChar(100), qr);
  updateReq.input("outdate", sql.DateTime, new Date());

  const result = await updateReq.query(`
    UPDATE [dbo].[PRDinput]
    SET
      processorder = @processorder,
      outqty = [Reci_qty],
      user261_id = @user,
      Remain = 0,
      statusout = @statusout,
      outdate = @outdate
    WHERE QR = @qr
  `);

  if ((result.rowsAffected?.[0] ?? 0) === 0) {
    throw new Error(`Update failed qrcode ${qr}`);
  }
}

/**
 * ค้นหา group machine ที่รองรับจาก reason code
 * โดยดึง group จาก GradeC_Code2026 แล้ว map ไปยัง machine ใน group_code_sub_process_detail
 */
export async function getGroupMachineByReasonCode(reasonCode: string): Promise<any[]> {
  const pool = await getPool(env.DB_MASTER_DATA);
  const groupReq = pool.request();
  groupReq.input("reason", sql.VarChar(20), reasonCode);
  const groupResult = await groupReq.query<{ group_process: string }>(`
    SELECT [Sub Process] AS group_process
    FROM [dbo].[GradeC_Code2026]
    WHERE Status = 'OK' AND Reason_Code = @reason
  `);

  const group = groupResult.recordset[0]?.group_process;
  if (!group) {
    return [];
  }

  const machineReq = pool.request();
  machineReq.input("group", sql.VarChar(100), group);
  const machineResult = await machineReq.query(`
    SELECT TOP (1000) [id], [group_code], [sub_proces]
    FROM [dbo].[group_code_sub_process_detail]
    WHERE group_code = @group
  `);

  return machineResult.recordset;
}

/**
 * เพิ่มรายการ Grade C ใหม่ลงตาราง GRADE_C
 */
export async function insertGradeC(input: GradeCInput): Promise<void> {
  const pool = await getPool(env.DB_GRADE_C);
  const request = pool.request();

  request.input("processorder", sql.VarChar(50), input.processorder || "");
  request.input("batch", sql.VarChar(50), input.batch);
  request.input("matcode", sql.VarChar(50), input.matcode);
  request.input("cqty", sql.Decimal(18, 2), input.cqty);
  request.input("reasonCode", sql.VarChar(20), input.reasonCode);
  request.input("lineSender", sql.VarChar(20), input.lineSender);
  request.input("lineReceiver", sql.VarChar(20), input.lineReceiver);
  request.input("sender", sql.VarChar(20), input.sender);
  request.input("groupMachine", sql.VarChar(50), input.groupMachine);
  request.input("createdAt", sql.DateTime, new Date());

  const result = await request.query(`
    INSERT INTO [dbo].[GRADE_C] (
      [QR_Code], Process_Order, Batch, Material, C_Qty,
      Reason_Code, Sending_Department, Receiving_Department,
      Status, MVT_309_User_ID_Request, [groupmachine], Created_At, [MVT_309_Date_Request]
    )
    VALUES (
      'none', @processorder, @batch, @matcode, @cqty,
      @reasonCode, @lineSender, @lineReceiver,
      'MVT-309', @sender, @groupMachine, @createdAt, @createdAt
    )
  `);

  if ((result.rowsAffected?.[0] ?? 0) === 0) {
    throw new Error("Insert grade C failed");
  }
}

/**
 * ยกเลิกรายการ Grade C ตาม id
 * จะยกเลิกได้เฉพาะรายการที่ยังไม่ถูกออกเอกสาร MVT_309_Doc
 */
export async function cancelGradeCById(id: number): Promise<void> {
  const pool = await getPool(env.DB_GRADE_C);
  const request = pool.request();
  request.input("id", sql.Int, id);

  const result = await request.query(`
    UPDATE [dbo].[GRADE_C]
    SET [Status] = 'Cancel'
    WHERE ID = @id AND MVT_309_Doc IS NULL
  `);

  if ((result.rowsAffected?.[0] ?? 0) === 0) {
    throw new Error("Cancel failed or row already processed");
  }
}

/**
 * สรุปยอด output ของ processorder + batch จาก PRDoutput
 */
export async function getACOutputByBatch(machine: string, processorder: string, batch: string): Promise<any[]> {
  const pool = await getPool(machine);
  const req = pool.request();
  req.input("processorder", sql.VarChar(50), processorder);
  req.input("batch", sql.VarChar(50), batch);

  const result = await req.query(`
    SELECT [mcname],[processorder],[Matcode],[matdes],[Batch],SUM([Qty]) AS totalOutput,[slocs]
    FROM [dbo].[PRDoutput]
    WHERE processorder = @processorder AND Batch = @batch
    GROUP BY [mcname],[processorder],[Matcode],[matdes],[Batch],[slocs]
  `);

  return result.recordset;
}

/**
 * ดึงรายการ Reason Grade C ที่ active (Status = OK)
 */
export async function getReasonCFeedIn(): Promise<any[]> {
  const pool = await getPool(env.DB_MASTER_DATA);
  const result = await pool.request().query(`
    SELECT [Reason_Code],[Eng_Name],[Reason_Name],[Defect_Type],[Sub_Group],[Process],[Status],[Sub Process] AS group_process
    FROM [dbo].[GradeC_Code2026]
    WHERE Status = 'OK'
  `);
  return result.recordset;
}

/**
 * ดึงรายการ batch rawmat ที่เคยผูกกับ processorder ใน PRDinput
 */
export async function getRawmatBatchByProcessorder(machine: string, processorder: string): Promise<any[]> {
  const pool = await getPool(machine);
  const req = pool.request();
  req.input("processorder", sql.VarChar(50), processorder);

  const result = await req.query(`
    SELECT DISTINCT [Batch]
    FROM [dbo].[PRDinput]
    WHERE processorder = @processorder
    ORDER BY [Batch] DESC
  `);

  return result.recordset;
}

/**
 * ดึงยอดสะสม C_Qty ของ batch + matcode (ไม่นับรายการที่ Cancel)
 * ใช้ภายในสำหรับคำนวณค่าประกอบในรายงาน
 */
async function getCqtyByBatchMatcode(batch: string, matcode: string): Promise<number> {
  const pool = await getPool(env.DB_GRADE_C);
  const req = pool.request();
  req.input("batch", sql.VarChar(50), batch);
  req.input("matcode", sql.VarChar(50), matcode);

  const result = await req.query<{ C_Qty: number }>(`
    SELECT SUM([C_Qty]) AS C_Qty
    FROM [dbo].[GRADE_C]
    WHERE Batch = @batch AND Material = @matcode AND ISNULL([Status], 'waiting') != 'Cancel'
  `);

  return Number(result.recordset[0]?.C_Qty ?? 0);
}

/**
 * ดึงรายการ WIP ที่ confirm แล้วตามช่วงเวลา พร้อมคำนวณ BatchPL
 * และเติมยอด cqty จากตาราง GRADE_C ให้แต่ละแถว
 */
export async function getWipConfirmedByDate(machine: string, dateStart: string, dateEnd: string): Promise<any[]> {
  const pool = await getPool(machine);
  const req = pool.request();
  req.input("dateStart", sql.DateTime, new Date(dateStart));
  req.input("dateEnd", sql.DateTime, new Date(dateEnd));
  req.input("machine", sql.VarChar(10), machine);

  const result = await req.query(`
    SELECT
      [Batch],[Matcode],SUM(Reci_qty) AS qty,SUM([cqty]) AS cqty,[processorder],
      CASE
        WHEN CAST(outdate AS TIME) >= '00:00:00' AND CAST(outdate AS TIME) < '08:00:00'
          THEN @machine + FORMAT(outdate, 'yyMMdd') + '1'
        WHEN CAST(outdate AS TIME) >= '08:00:00' AND CAST(outdate AS TIME) < '20:00:00'
          THEN @machine + FORMAT(outdate, 'yyMMdd') + '2'
        ELSE @machine + FORMAT(DATEADD(DAY, 1, outdate), 'yyMMdd') + '1'
      END AS BatchPL
    FROM [dbo].[PRDinput]
    WHERE statusout = 'Off' AND outdate BETWEEN @dateStart AND @dateEnd
    GROUP BY [Batch],[Matcode],[processorder],
      CASE
        WHEN CAST(outdate AS TIME) >= '00:00:00' AND CAST(outdate AS TIME) < '08:00:00'
          THEN @machine + FORMAT(outdate, 'yyMMdd') + '1'
        WHEN CAST(outdate AS TIME) >= '08:00:00' AND CAST(outdate AS TIME) < '20:00:00'
          THEN @machine + FORMAT(outdate, 'yyMMdd') + '2'
        ELSE @machine + FORMAT(DATEADD(DAY, 1, outdate), 'yyMMdd') + '1'
      END
  `);

  const rows = result.recordset;
  for (const row of rows) {
    row.cqty = await getCqtyByBatchMatcode(row.Batch, row.Matcode);
  }

  return rows;
}

/**
 * ดึงรายการ FG output ตามช่วงเวลา และเติมยอด cqty ต่อ batch/matcode
 */
export async function getFgByDate(machine: string, dateStart: string, dateEnd: string): Promise<any[]> {
  const pool = await getPool(machine);
  const req = pool.request();
  req.input("dateStart", sql.DateTime, new Date(dateStart));
  req.input("dateEnd", sql.DateTime, new Date(dateEnd));

  const result = await req.query(`
    SELECT [mcname],[processorder],[Matcode],[matdes],[PRDoutput].[Batch],SUM([Qty]) AS totalOutput,[slocs]
    FROM [dbo].[PRDoutput]
    WHERE Sentdoc IS NULL AND Gr_time BETWEEN @dateStart AND @dateEnd
    GROUP BY [mcname],[processorder],[Matcode],[matdes],[PRDoutput].[Batch],[slocs]
  `);

  const rows = result.recordset;
  for (const row of rows) {
    row.cqty = await getCqtyByBatchMatcode(row.Batch, row.Matcode);
  }

  return rows;
}

/**
 * ดึงรายละเอียดรายการ Grade C ที่ยืนยันแล้วตาม batch + matcode
 * พร้อม join reason และชื่อผู้ใช้งาน
 */
export async function getGradeCConfirmedDetail(batch: string, matcode: string): Promise<any[]> {
  const pool = await getPool(env.DB_GRADE_C);
  const req = pool.request();
  req.input("batch", sql.VarChar(50), batch);
  req.input("matcode", sql.VarChar(50), matcode);

  const result = await req.query(`
    SELECT [ID],[Batch],[Material],[C_Qty],[dbo].[GRADE_C].[Reason_Code],
      Master_data.dbo.GradeC_Code.Reason_Code,
      Master_data.dbo.GradeC_Code.Reason_Name,
      [dbo].[GRADE_C].[groupmachine] AS [GroupMachine],
      [Sending_Department],[Receiving_Department],[MVT_309_User_ID_Request],UserLogin.English_Name
    FROM [dbo].[GRADE_C]
    LEFT JOIN Master_data.dbo.GradeC_Code ON [dbo].[GRADE_C].Reason_Code = Master_data.dbo.GradeC_Code.Reason_Code
    LEFT JOIN User_Management.dbo.UserLogin ON UserLogin.EmployeeCode = [MVT_309_User_ID_Request]
    WHERE Batch = @batch AND Material = @matcode AND ISNULL([GRADE_C].[Status], 'waiting') != 'Cancel'
  `);

  return result.recordset;
}

/**
 * ค้นหา batch rawmat ล่าสุดที่สัมพันธ์กับ processorder FG และ batch FG
 * ใช้กรณี auto หา lineReceiver ตอน confirm grade C feed out
 */
export async function getBatchRawmatByProcessorderFG(machine: string, processorder: string, batchFg: string): Promise<any | null> {
  const batchNoMachine = batchFg.slice(3);
  const pool = await getPool(machine);
  const req = pool.request();
  req.input("processorder", sql.VarChar(50), processorder);
  req.input("batchNoMachine", sql.VarChar(50), batchNoMachine);

  const result = await req.query(`
    SELECT TOP 1 [Departsent],[Slocsent],[Batch],[Matcode],[Reci_qty]
    FROM [dbo].[PRDinput]
    WHERE processorder = @processorder
      AND CASE
        WHEN CAST(outdate AS TIME) >= '00:00:00' AND CAST(outdate AS TIME) < '08:00:00'
          THEN FORMAT(outdate, 'yyMMdd') + '1'
        WHEN CAST(outdate AS TIME) >= '08:00:00' AND CAST(outdate AS TIME) < '20:00:00'
          THEN FORMAT(outdate, 'yyMMdd') + '2'
        ELSE FORMAT(DATEADD(DAY, 1, outdate), 'yyMMdd') + '1'
      END = @batchNoMachine
    ORDER BY outdate DESC
  `);

  return result.recordset[0] ?? null;
}
