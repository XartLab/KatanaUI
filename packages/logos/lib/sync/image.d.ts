export type ImageFormat = 'png' | 'jpeg' | 'gif' | 'webp' | 'ico' | 'svg';
export type ImageProbe = {
    format: ImageFormat;
    width: number;
    height: number;
    /** 解得出像素时：RGBA，每像素 4 字节。 */
    rgba?: Uint8Array;
};
export type RejectReason = 'unreadable' | 'too-small' | 'google-placeholder' | 'wordmark' | 'blank' | 'flat';
export type Assessment = {
    ok: true;
    format: ImageFormat;
    width: number;
    height: number;
} | {
    ok: false;
    reason: RejectReason;
    format?: ImageFormat;
    width?: number;
    height?: number;
};
export declare const MIN_SIZE = 32;
export declare const MAX_ASPECT = 2.2;
/** 解 PNG（8 / 16 位，灰、RGB、调色板、灰 + α、RGBA；不解隔行扫描，隔行只给宽高）。 */
export declare function decodePng(b: Uint8Array): ImageProbe | undefined;
/** 读格式与宽高（能解像素的连像素）；认不出返回 undefined。 */
export declare function probeImage(bytes: Uint8Array): (ImageProbe & {
    empty?: boolean;
}) | undefined;
/** 像素是不是空白（几乎全透明）或一整块单色。 */
export declare function blankness(rgba: Uint8Array): 'blank' | 'flat' | undefined;
/** 按规则判一张图；source 用来认 Google favicon 的 16px 占位。 */
export declare function assessImage(bytes: Uint8Array, source?: {
    url?: string;
}): Assessment;
/** 测试与示例用：编码一张 RGBA 的 PNG（不压缩优化，过滤全 0）。 */
export declare function encodePng(width: number, height: number, rgba: Uint8Array): Promise<Uint8Array<ArrayBuffer>>;
