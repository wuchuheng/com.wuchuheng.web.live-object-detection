declare module "*.mp3" {
  const src: string;
  export default src;
}

declare module "*.less" {
  const content: { [className: string]: string };
  export default content;
}
