import { z } from 'zod'

export const t = 425
export const subCarrierFrequency = 38000
const frameLength = 130000

export const aehaFormatSchema = z.object({
  /**
   * The Code that identifies the device manufacturer. (16bit, MSB first)
   */
  customerCode: z.coerce.number().int().min(0).max(0xffff),
  /**
   * Command data (28bit typ, MSB first)
   */
  command: z.coerce.number().int().min(0),
})

export const AEHAFormatConverter = {
  encode(data: z.infer<typeof aehaFormatSchema>): number[] {
    const res: number[] = []

    // Leader (ON: 8T + OFF: 4T)
    res.push(t * 8)
    res.push(t * 4)

    // Customer Code
    for (let i = 0; i < 16; i++)
      addBit(!!(data.customerCode & (1 << i)))

    // Parity
    let parity = 0
    for (let i = 0; i < 16; i += 4) {
      parity ^= (data.customerCode & (0b1111 << i)) >> i
    }
    for (let i = 0; i < 4; i++)
      addBit(!!(parity & (1 << i)))

    // Command
    for (let i = 0; (1 << i) <= data.command; i += 4) {
      addBit(!!(data.command & (1 << i)))
      addBit(!!(data.command & (1 << i + 1)))
      addBit(!!(data.command & (1 << i + 2)))
      addBit(!!(data.command & (1 << i + 3)))
    }

    // Trailer (ON: 1T + OFF: nT)
    res.push(t)
    res.push(8000) // 8ms

    return res

    function addBit(bit: boolean) {
      if (bit) { // 1 (ON: 1T + OFF: 3T)
        res.push(t)
        res.push(t * 3)
      } else { // 0 (ON: 1T + OFF: 1T)
        res.push(t)
        res.push(t)
      }
    }
  }
}
