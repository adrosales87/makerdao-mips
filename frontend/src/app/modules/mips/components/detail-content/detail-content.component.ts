import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  EventEmitter,
  Output,
  ComponentFactoryResolver,
  Injector,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {environment} from '../../../../../environments/environment';
import {MarkdownService} from 'ngx-markdown';
import {ActivatedRoute, Router} from '@angular/router';
import {MipsService} from '../../services/mips.service';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategyOrigin,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import {TemplatePortal} from '@angular/cdk/portal';
import {Observable, Subscription} from 'rxjs';
import {Title} from '@angular/platform-browser';
import {UrlService} from 'src/app/services/url/url.service';
import {SubproposalsComponent} from '../subproposals/subproposals.component';
import {MdInformationComponent} from '../md-information/md-information.component';

@Component({
  selector: 'app-detail-content',
  templateUrl: './detail-content.component.html',
  styleUrls: ['./detail-content.component.scss'],
  animations: [
    trigger('enterLeaveSmooth', [
      transition(':enter', [
        style({opacity: 0, transform: 'scale(0.9)'}),
        animate(50, style({opacity: 1, transform: 'scale(1)'})),
      ]),
      transition(':leave', [animate(100, style({opacity: 0}))]),
    ]),
  ],
  host: {
    '[class]': "darkMode ? 'hostDarkMode':''",
  },
})
export class DetailContentComponent
  implements OnInit, OnChanges, AfterViewInit {
  constructor(
    private markdownService: MarkdownService,
    private router: Router,
    private route: ActivatedRoute,
    private mipsService: MipsService,
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef,
    private titleService: Title,
    private urlService: UrlService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private cdr: ChangeDetectorRef
  ) {
  }

  gitHubUrl = environment.repoUrl;
  @Input() mdUrl: string | undefined;
  queryMdUrl : string;
  @Input() sourceData;
  mdFileName = '';
  openMore: boolean;
  positionPopup: ConnectedPosition[] = new Array<ConnectedPosition>();
  @Input() darkMode: boolean;
  @Input() mip: any;
  @Input() mipName: string;
  @Output() headingListUpdate = new EventEmitter();

  urlOriginal: string;
  links: Link[] = [];
  countLinks = 0;
  @ViewChild('preview') preview: TemplateRef<any>;
  overlayRef: OverlayRef | null;
  templatePortal: TemplatePortal<any>;
  content: any;
  triangleUp: boolean;
  triangleLeft: boolean;
  triangleCenter = false;
  @Input() subproposals: any[] = [];
  subscription: Subscription;
  @ViewChild('previewRef') previewRef: ElementRef;
  subproposalCode = '';
  subproposalTitle = '';
  sections: any;

  headingStructure: Heading[] = [];
  subproposalsGroup: any = {};

  smartLinkWindowUp = false;
  titleMdFile = '';
  linkSelect: string;

  mapped: any[];

  leftPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
    },
  ];

  rightPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
    },
  ];

  centerPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
    },
  ];

  ngOnInit(): void {
    this.overrideDefaultHeadings();
    this.getDefaultLinks();
    this.overrideDefaultTables();
    this.overrideDefaultImg();

    this.initPositionPopup();

    this.queryMdUrl = this.route.snapshot.queryParams.mdUrl;
  }

  doReloadSourceData() {
    this.cdr.detectChanges();
    this.doLoadHeadings(this.sections);
  }

  doLoadHeadings(sections: any) {
    const pattern = /mip[0-9]+c[0-9]+:/i;
    let escapedText;

    this.mapped = sections.map((d) => {
      if (pattern.test(d.heading)) {
        return (escapedText = d.heading?.split(':')[0]);
      }
      escapedText = d.heading?.toLowerCase().replace(/[^\w]+/g, '-');
      return escapedText;
    });
  }

  ngAfterViewInit() {
    if (this.route.snapshot.fragment) {
      const el = document.getElementById(
        this.route.snapshot.fragment.toString()
      );

      this.moveToElement(el);
    }

    if (this.sourceData) {
      this.doLoadHeadings(this.sourceData);
    }
  }

  isTouchDevice() {
    return window.matchMedia('(pointer: coarse)').matches
  }

  setPreviewFeature() {
    if (!this.isTouchDevice()) {
      const links = document.getElementsByClassName('linkPreview');
      for (let index = 0; index < links.length; index++) {
        const element = links.item(index);
        element.addEventListener('mouseover', this.displayPreview);
        element.addEventListener('mouseleave', this.closePreview);
      }
    }
  }

  showOverview(data, posStrategy, leftSide, center) {
    const positionsOfTheSmartLinkWindow: ConnectedPosition[] = center
      ? this.centerPositions
      : leftSide
        ? this.leftPositions
        : this.rightPositions;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(posStrategy)
      .withPositions(positionsOfTheSmartLinkWindow);

    positionStrategy.positionChanges.subscribe((pos) => {
      if (
        pos.connectionPair.originX === 'end' &&
        pos.connectionPair.originY === 'bottom' &&
        pos.connectionPair.overlayX === 'end' &&
        pos.connectionPair.overlayY === 'top'
      ) {
        this.triangleUp = true;
        this.triangleLeft = false;
        this.triangleCenter = false;
      } else if (
        pos.connectionPair.originX === 'start' &&
        pos.connectionPair.originY === 'bottom' &&
        pos.connectionPair.overlayX === 'start' &&
        pos.connectionPair.overlayY === 'top'
      ) {
        this.triangleUp = true;
        this.triangleLeft = true;
        this.triangleCenter = false;
      } else if (
        pos.connectionPair.originX === 'end' &&
        pos.connectionPair.originY === 'top' &&
        pos.connectionPair.overlayX === 'end' &&
        pos.connectionPair.overlayY === 'bottom'
      ) {
        this.triangleUp = false;
        this.triangleLeft = false;
        this.triangleCenter = false;
      } else if (
        pos.connectionPair.originX === 'start' &&
        pos.connectionPair.originY === 'top' &&
        pos.connectionPair.overlayX === 'start' &&
        pos.connectionPair.overlayY === 'bottom'
      ) {
        this.triangleUp = false;
        this.triangleLeft = true;
        this.triangleCenter = false;
      } else if (
        pos.connectionPair.originX === 'start' &&
        pos.connectionPair.originY === 'top' &&
        pos.connectionPair.overlayX === 'center' &&
        pos.connectionPair.overlayY === 'bottom'
      ) {
        this.triangleUp = false;
        this.triangleCenter = true;
      } else if (
        pos.connectionPair.originX === 'start' &&
        pos.connectionPair.originY === 'bottom' &&
        pos.connectionPair.overlayX === 'center' &&
        pos.connectionPair.overlayY === 'top'
      ) {
        this.triangleUp = true;
        this.triangleCenter = true;
      }

      const element: HTMLElement =
        this.previewRef.nativeElement.parentElement.parentElement;
      element.style.marginTop = '17px';
      element.style.marginBottom = '17px';
    });

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    this.overlayRef.attach(
      new TemplatePortal(this.preview, this.viewContainerRef, {
        $implicit: data,
      })
    );
    this.smartLinkWindowUp = true;
  }

  displayPreview = (e: MouseEvent) => {
    if (!this.smartLinkWindowUp) {
      const link = e.target as HTMLAnchorElement;

      const windowWidth = window.innerWidth;
      const mousePosW = e.screenX;
      const leftSide = mousePosW < windowWidth / 2;
      const center = Math.abs(mousePosW - windowWidth / 2) < 90;

      if (link?.rel?.includes('smart-')) {
        const type = link.rel.split('-')[1];

        switch (type) {
          case 'Mip':
            const mipNameMatches = link.href.match(/MIP\d+/gi);

            if (mipNameMatches) {
              const mipName = mipNameMatches[0].replace(/MIP/i, 'MIP');

              this.subscription = this.mipsService
                .getMipBy('mipName', mipName)
                .subscribe((data) => {
                  if (data) {
                    const posStrategy: FlexibleConnectedPositionStrategyOrigin =
                      e.target as HTMLElement;

                    this.showOverview(
                      {...data, typeOfView: 'mipName'},
                      posStrategy,
                      leftSide,
                      center
                    );
                  }
                });
            }

            break;

          case 'Component':
            const mipComponentMatches = link.href.match(/MIP\d+c\d+/gi);

            if (mipComponentMatches) {
              const mipComponent = mipComponentMatches[0].replace(
                /MIP/i,
                'MIP'
              );

              this.subscription = this.mipsService
                .getMipBy('mipComponent', mipComponent)
                .subscribe((data) => {
                  if (data) {
                    const posStrategy: FlexibleConnectedPositionStrategyOrigin =
                      e.target as HTMLElement;

                    const components = data.components;
                    const mipComponentName =
                      components &&
                      Array.isArray(components) &&
                      components.length > 0 &&
                      components[0].cName;

                    const mipName =
                      (mipComponentName &&
                        mipComponentName.match(/MIP\d+/gi) &&
                        mipComponentName.match(/MIP\d+/gi)[0]) ||
                      '';

                    const componentCode =
                      (mipComponentName &&
                        mipComponentName.match(/[ca]\d+/gi) &&
                        mipComponentName.match(/[ca]\d+/gi)[0]) ||
                      '';

                    this.showOverview(
                      {
                        ...data,
                        typeOfView: 'mipComponent',
                        componentCode,
                        mipName,
                      },
                      posStrategy,
                      leftSide,
                      center
                    );
                  }
                });
            }
            break;

          case 'Subproposal':
            const mipSubproposalMatch = link.href.match(/MIP\d+c\d+-?SP\d+/gi);

            if (mipSubproposalMatch) {
              const mipSubproposal = mipSubproposalMatch[0].replace(
                /MIP/i,
                'MIP'
              );

              this.subscription = this.mipsService
                .getMipBy('mipSubproposal', mipSubproposal)
                .subscribe((data) => {
                  if (data) {
                    const posStrategy: FlexibleConnectedPositionStrategyOrigin =
                      e.target as HTMLElement;

                    this.showOverview(
                      {...data, typeOfView: 'mipSubproposal'},
                      posStrategy,
                      leftSide,
                      center
                    );
                  }
                });
            }
            break;
          default:
            break;
        }
      }
    }
  };

  closePreview = (e: Event) => {
    if (this.subscription && !this.subscription.closed) {
      this.subscription.unsubscribe();
    }

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }

    if (this.smartLinkWindowUp) {
      setTimeout(() => {
        // To avoid the race condition

        this.smartLinkWindowUp = false;
      }, 0);
    }
  };

  ngOnChanges() {
    if (this.mip && this.mip?.sectionsRaw) {
      this.content = this.mip?.title
        ? (this.mip?.sectionsRaw as []).slice(1).join('\n')
        : (this.mip?.sectionsRaw as []).join('\n');

      if (this.mip?.proposal && this.mip?.title) {
        const subProposalTitleArray: string[] = this.mip?.title.split(':');

        if (subProposalTitleArray.length > 1) {
          this.subproposalCode = subProposalTitleArray[0];
          this.subproposalTitle = subProposalTitleArray.slice(1).join('');
        } else {
          this.subproposalCode = this.mip?.mipName;
          this.subproposalTitle = this.mip?.title;
        }
      }
      this.titleService.setTitle(
        this.mip?.proposal
          ? this.mip?.title
          : this.mip?.mipName + ': ' + this.mip?.title
      );
    }

    this.getDefaultLinks();
    this.overrideDefaultHeadings();
    this.overrideDefaultTables();
    this.overrideDefaultImg();

    this.urlOriginal =
      this.urlService.getGithubLinkFromMdRaw(this.mdUrl) || this.mdUrl;

    const nameMdMatch: RegExpMatchArray = this.mdUrl?.match(/\/[\w\s-]+\.md/g);

    if (nameMdMatch && nameMdMatch[0]) {
      this.mdFileName = nameMdMatch[0].replace('/', '');
    }
  }

  onReady() {
    if (this.mdUrl) {
      this.headingListUpdate.emit(this.headingStructure);
    }
    if (this.route.snapshot.fragment) {
      const el = document.getElementById(
        this.route.snapshot.fragment.toString()
      );

      this.moveToElement(el);
    }
    this.headingStructure = [];
    if (!this.mdUrl) {
      // On md viewer THERE IS NOT NEED of THIS and may cuse a problem with md relatives links
      this.searchMips();
    }
    this.setPreviewFeature();
    this.appendSubproposalsElements();
    this.appendExtraElements();

    this.addLinksToComponentSummary();
    this.removeSmartLinking();
  }

  async appendSubproposalsElements() {
    if (this.subproposals) {
      const subData = await this.getSubproposals();
      const subproposals: any[] = subData.items;

      subproposals.map((item) => {
        const newItem = this.addSubsetField(item);
        return newItem;
      });

      const subproposalsGroup: any = this.groupBy('subset', subproposals);

      this.sortSubproposalsGroups(subproposalsGroup);
      this.subproposalsGroup = subproposalsGroup;

      // DOM manipulation
      const m: HTMLElement = document.querySelector('.variable-binding');
      const h3s: HTMLCollectionOf<HTMLHeadingElement> =
        m.getElementsByTagName('h3');

      for (const key in this.subproposalsGroup) {
        if (Object.prototype.hasOwnProperty.call(this.subproposalsGroup, key)) {
          for (let i = 0; i < h3s.length; i++) {
            const element = h3s.item(i);
            if (element.innerText.startsWith(key)) {
              const componentFactory =
                this.componentFactoryResolver.resolveComponentFactory(
                  SubproposalsComponent
                );
              const componentRef = componentFactory.create(this.injector);
              componentRef.instance.subproposals = [
                ...this.subproposalsGroup[key],
              ];
              componentRef.hostView.detectChanges();
              const {nativeElement} = componentRef.location;

              // search in DOM the next component section
              let found = false;
              let j: number = i + 1;
              while (j < h3s.length && !found) {
                const nextElement: HTMLHeadingElement = h3s.item(j);

                if (nextElement.innerText.startsWith(this.mip.mipName)) {
                  found = true;
                  const prev = nextElement.previousElementSibling;

                  if (prev.tagName === 'HR') {
                    prev.insertAdjacentElement('beforebegin', nativeElement);
                  } else {
                    prev.insertAdjacentElement('afterend', nativeElement);
                  }
                }

                j++;
              }

              if (j >= h3s.length && !found) {
                const lastChild = m.lastElementChild;

                if (lastChild.tagName === 'HR') {
                  lastChild.insertAdjacentElement('beforebegin', nativeElement);
                } else {
                  lastChild.insertAdjacentElement('afterend', nativeElement);
                }
              }
            }
          }
        }
      }

    }

  }

  appendExtraElements() {

    // DOM manipulation
    const m: HTMLElement = document.querySelector('.variable-binding');

    const extra = this.mip?.extra || [];

    extra.reverse().forEach((item) => {
      const componentFactory =
        this.componentFactoryResolver.resolveComponentFactory(
          MdInformationComponent
        );
      const componentRef = componentFactory.create(this.injector);
      componentRef.instance.additionalInformation = [
        item
      ];
      componentRef.hostView.detectChanges();
      const {nativeElement} = componentRef.location;

      m.insertAdjacentElement('afterbegin', nativeElement);
    })


  }

  addSubsetField = (item: any) => {
    const subset: string = (item.mipName as string)?.split('SP')[0];
    item.subset = subset;
    return item;
  };

  groupBy(field, arr: any[]): any {
    const group: any = arr.reduce((r, a) => {
      r[a[field]] = [...(r[a[field]] || []), a];
      return r;
    }, {});

    return group;
  }

  sortSubproposalsGroups(subproposalsGroup: any) {
    for (const key in subproposalsGroup) {
      if (Object.prototype.hasOwnProperty.call(subproposalsGroup, key)) {
        const element: any[] = subproposalsGroup[key];
        subproposalsGroup[key] = this.sortSubproposalGroup(element);
      }
    }
  }

  sortSubproposalGroup(arr: any[]) {
    return arr.sort(function (a: any, b: any) {
      return (a.mipName as string).includes('SP') &&
      a.mipName.split('SP').length > 1
        ? +a.mipName.split('SP')[1] < +b.mipName.split('SP')[1]
          ? -1
          : 1
        : 1;
    });
  }

  getSubproposals() {
    const order = 'mip mipName';
    const filter = {
      contains: [],
      notcontains: [],
      equals: [],
      notequals: [],
      inarray: [],
    };

    filter.notequals.push({field: 'mip', value: -1});
    filter.equals.push({field: 'proposal', value: this.mip.mipName});

    return this.mipsService
      .searchMips(
        100000,
        0,
        order,
        '',
        filter,
        'title proposal mipName mip status'
      )
      .toPromise();
  }

  onError() {
    this.router.navigateByUrl('/');
    setTimeout(() => {
      // To avoid the race issue

      this.router.navigateByUrl('page-not-found');
    }, 0);
  }

  moveToElement(el: HTMLElement): void {
    if (el) {
      el.scrollIntoView();
    }
  }

  overrideDefaultHeadings() {
    const url = this.router.url.split('#')[0];

    this.markdownService.renderer.heading = (
      text: string,
      level: number,
      raw: string
    ) => {
      const matchMipComponentName = text?.match(
        /^(?<mipComponent>MIP\d+[ca]\d+)\s?:/i
      );

      const mipComponent = matchMipComponentName?.groups?.mipComponent;

      const htmlCleanedText = raw.replace(/<[^<>]+>/gm, '');

      const escapedText = mipComponent
        ? mipComponent
        : htmlCleanedText.toLowerCase().replace(/[^\w]+/g, '-');

      let style = '';

      if (this.mip?.title?.localeCompare(text) === 0) {
        style = `style="display:none;"`;
      }

      this.headingStructure.push({heading: htmlCleanedText, depth: level});

      if (this.mdUrl && level === 1) {
        this.titleMdFile = text;
        return '';
      } else {
        return `
             <h${level} ${style}>
               <a name="${escapedText}" id="${escapedText}" class="anchor" href="${url}#${escapedText}">
                 <i id="${escapedText}" class="fas fa-link"></i>
               </a>${text}</h${level}>`;
      }
    };
  }

  overrideDefaultTables() {
    this.markdownService.renderer.table = (header: string, body: string) => {
      return `<div style="overflow-x:auto; margin-bottom: 16px;">
                <table>
                  <thead>${header}</thead>
                  <tbody>${body}</tbody>
                </table>
              </div>`;
    };
  }

  overrideDefaultImg() {
    this.markdownService.renderer.image = (
      href: string,
      title: string,
      text: string
    ) => {
      return `<img src="${href}?raw=true">`;
    };
  }

  getDefaultLinks() {
    this.links = [];

    this.markdownService.renderer.link = (
      href: string,
      title: string,
      text: string
    ) => {
      const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
      const id = `md-${escapedText}${this.countLinks++}`;

      const link: Link = {
        id,
        name: text,
        link: href,
      };

      this.links.push({...link});

      if (
        !link.name.includes('Template') &&
        !title?.includes('NON-SMART-LINK') &&
        (link.link.includes(this.gitHubUrl) ||
          title?.includes('smart') ||
          link.link.match(/MIP\d+(?:[ca]\d+)?(?:-?SP\d+)?/gi) ||
          link.link.includes('https://github.com/makerdao/mips/blob') ||
          link.link.includes('https://github.com/makerdao/mips/tree') ||
          link.link.includes('https://forum.makerdao.com'))
      ) {
        let newTitle = '';

        if (link.link.match(/MIP\d+c\d+-?SP\d+/gi)) {
          newTitle = 'smart-Subproposal';
        } else if (link.link.match(/MIP\d+c\d+/gi)) {
          newTitle = 'smart-Component';
        } else if (link.link.match(/MIP\d+/gi)) {
          newTitle = 'smart-Mip';
        }

        const relText = newTitle?.includes('smart')
          ? 'rel="' + newTitle + '"'
          : title?.includes('smart')
            ? 'rel="' + title + '"'
            : '';

        return `<a id="${link.id}" class="linkPreview" ${relText}
        newTitle
        href="${href}">${text}</a>`;
      }

      if (this.mdUrl) {
        // MD VIEWER BEHAVIOR
        if (!href.includes('https://')) {
          // I asume a github md relative link

          const baseUrl = this.mdUrl.replace(/\/?[\w-#\.\s]+$/g, '');

          if (!href.includes('.md')) {
            // Relarive reference only link ex: #last-thing
            href =
              this.urlService.mdViewerRoute +
              baseUrl +
              '/' +
              this.mdFileName +
              href;
          } else {
            href =
              this.urlService.mdViewerRoute +
              baseUrl +
              '/' +
              href.replace(/^\//, '');
          }
        } else {
          // A non relative link
          href = this.urlService.transformLinkForMd(href);
        }
      }
      return `<a name="${escapedText}" id="${link.id}" class="anchor-link" href="${href}">${text}</a>`;
    };
  }

  searchMipsByNameAndOverrideLink(
    limit,
    page,
    order,
    search,
    filter,
    link: Link
  ): void {
    this.mipsService
      .searchMips(limit, page, order, search, filter)
      .subscribe((data) => {
        if (data.items && data.items[0]) {
          // override link in DOM
          const elem = document.getElementById(link.id);
          elem.setAttribute('href', '/mips/details/' + data.items[0].mipName);
        }
      });
  }

  searchMips() {
    this.links.forEach((link) => {
      const elem = document.getElementById(link.id);

      if (!link.name.includes('Template')) {
        if (
          link.link.includes(this.gitHubUrl) ||
          link.link.includes('https://github.com/makerdao/mips/blob') ||
          link.link.includes('https://github.com/makerdao/mips/tree') ||
          link.link.includes('https://forum.makerdao.com')
        ) {
          if (link.link.includes('MIP')) {
            const mip = link.link.replace(`${this.gitHubUrl}/`, '').split('#');

            if (mip?.length > 0) {
              this.mipsService
                .getMipByFilename(mip[0], 'filename')
                .subscribe((data) => {
                  if (mip?.length > 1) {
                    elem.setAttribute(
                      'href',
                      `/mips/details/${data.mipName}#${mip[1]}`
                    );
                  } else {
                    elem.setAttribute('href', `/mips/details/${data.mipName}`);
                  }
                });
            }
          } else {
            const field = 'mipName';
            const fieldValue = link.name.trim();

            this.mipsService
              .getMipByFilename(fieldValue, field)
              .subscribe((data) => {
                if (data?.mipName) {
                  elem.setAttribute('href', `/mips/details/${data.mipName}`);
                } else {
                  elem.setAttribute(
                    'href',
                    `${this.gitHubUrl}/${this.mip?.filename}`
                  );
                }
              });
          }
        } else {
          if (
            !link.link.includes('http') &&
            !link.link.match(/mips\/details\/MIP\d/gi)
          ) {
            elem.setAttribute(
              'href',
              `${this.gitHubUrl}/${this.mip?.mipName}/${link.link}`
            );
          }
        }
      } else {
        if (link.link.includes('.md') && !link.link.includes('http')) {
          elem.setAttribute(
            'href',
            `${this.gitHubUrl}/${this.mip?.mipName}/${link.link}`
          );
        }
      }
    });
  }

  initPositionPopup() {
    this.positionPopup = [
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
      },
    ];
  }

  closePopup() {
    this.openMore = false;
  }

  onClickOutside(ev: MouseEvent) {
    ev.stopPropagation();
    this.closePopup();
  }

  ngOnDestroy() {
    this.titleService.setTitle('MIPs Portal');
  }

  getParentNodeIndex(elem){
    return [...elem.parentNode.parentNode.children].indexOf(elem.parentNode)
  }

  addLinksToComponentSummary() {
    const motivationNode = document.querySelector('a#motivation');
    const motivationParentIndex = this.getParentNodeIndex(motivationNode);

    const regexMip = new RegExp('^'+this.mipName+'c' +'\\d: ');
    const nodeList = document.querySelectorAll('strong');
    const elementArray: HTMLElement[] = Array.prototype.slice.call(nodeList, 0);

    let counter = 0;
    elementArray.forEach(strongElement => {
     const innerText = strongElement.innerText;

     if (innerText.match(regexMip) && (this.getParentNodeIndex(strongElement) < motivationParentIndex)){
       counter++;
       const newLink = document.createElement('a');
       newLink.href="/mips/details/"+this.mipName+'#'+this.mipName+'c'+counter;
       newLink.innerHTML = innerText;
       strongElement.parentElement.replaceChild(newLink, strongElement);
     }
    });
    this.cdr.detectChanges();
  }

  removeSmartLinking() {
    const regexMip = new RegExp('^'+this.mipName+'$');
    const regexMipSub = new RegExp('^'+this.mipName+'c' +'\\d'+'$');

    const nodeList = document.querySelectorAll('a');
    const elementArray: HTMLElement[] = Array.prototype.slice.call(nodeList, 0);

    elementArray.forEach(linkElement => {
      const innerText = linkElement.innerText;

      if (innerText.match(regexMip) || innerText.match(regexMipSub)){
        const newSpan = document.createElement('span');
        newSpan.innerHTML = innerText;
        linkElement.parentElement.replaceChild(newSpan, linkElement);
      }
    });
    this.cdr.detectChanges();
  }

  @HostListener('window:scroll') handleContentScroll() {
    if (this.route.snapshot.fragment !== this.linkSelect) {
      this.linkSelect = this.route.snapshot.fragment;
      return;
    }

    this.mapped?.find((ele) => {
      const link = document.getElementById(ele);
      const linkSelected = link?.id;
      const bound = link?.getBoundingClientRect();
      if (bound && bound?.y > -5 && bound?.y < 170) {
        if (this.mdUrl) {
          this.router.navigate([], {
            queryParams: {
              mdUrl: this.queryMdUrl,
              fromChild: true
            },
            fragment: linkSelected,
            replaceUrl: true,
          });
        } else {
          this.router.navigate([], {
            fragment: linkSelected,
            replaceUrl: true,
          });
        }
        this.linkSelect = link?.id;
        return true;
      }
    });
  }


}

interface Link {
  id: string;
  name: string;
  link: string;
}

interface Heading {
  heading: string;
  depth: number;
}
