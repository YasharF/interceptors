import zlib from 'node:zlib'

export class BrotliDecompressionStream extends TransformStream {
  constructor() {
    const decompress = zlib.createBrotliDecompress({
      flush: zlib.constants.BROTLI_OPERATION_FLUSH,
      finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH,
    })

    super({
      async transform(chunk, controller) {
        const buffer = Buffer.from(chunk)
        let decompressed: Buffer
        try {
          decompressed = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = []
            const onData = (data: Buffer) => chunks.push(data)
            decompress.on('data', onData)
            decompress.write(buffer, (error) => {
              if (error) {
                decompress.off('data', onData)
                reject(error)
                return
              }
              decompress.flush(() => {
                decompress.off('data', onData)
                resolve(Buffer.concat(chunks))
              })
            })
            decompress.once('error', (error) => {
              decompress.off('data', onData)
              reject(error)
            })
          })
        } catch (error) {
          controller.error(error)
          return
        }
        controller.enqueue(decompressed)
      },
    })
  }
}
