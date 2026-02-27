/**
 * แปลงวันและกะการผลิตให้เป็นช่วงเวลาเริ่ม-สิ้นสุดสำหรับ query ข้อมูล
 * - กะ day: 08:00:00 - 19:59:59 ของวันเดียวกัน
 * - กะ night: 20:00:00 ของวันก่อนหน้า - 07:59:59 ของวันที่เลือก
 */
export function getShiftRange(date: string, shift: string): { dateStart: string; dateEnd: string } {
  if (shift === "day") {
    return {
      dateStart: `${date} 08:00:00`,
      dateEnd: `${date} 19:59:59`
    };
  }

  const prevDay = new Date(`${date}T00:00:00`);
  prevDay.setDate(prevDay.getDate() - 1);
  const yyyy = prevDay.getFullYear();
  const mm = String(prevDay.getMonth() + 1).padStart(2, "0");
  const dd = String(prevDay.getDate()).padStart(2, "0");

  return {
    dateStart: `${yyyy}-${mm}-${dd} 20:00:00`,
    dateEnd: `${date} 07:59:59`
  };
}
