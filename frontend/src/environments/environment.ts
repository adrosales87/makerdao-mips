// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // apiUrl: 'http://localhost:3001',
  apiUrl: 'http://159.203.86.45:3001',
  // apiUrl: "https://mips-api.makerdao.com",
  repoUrl: 'https://github.com/makerdao/mips/blob/master',
  feedBackFormUrl: 'https://formspree.io/f/xzbyjjnb',
  githubURL: 'https://github.com/',
  menuURL:'https://raw.githubusercontent.com/DSpotDevelopers/mips/master/meta/menu.yaml',
  menuURLAuxiliar:'https://raw.githubusercontent.com/DSpotDevelopers/mips/master/meta/menu.json',
  varsURL: 'https://raw.githubusercontent.com/DSpotDevelopers/mips/master/meta/vars.yaml',
  newsURL: 'https://raw.githubusercontent.com/DSpotDevelopers/mips/master/meta/news.yaml'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
