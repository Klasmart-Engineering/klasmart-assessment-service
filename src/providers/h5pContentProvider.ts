import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { Benchmark } from '../helpers/benchmarkMiddleware'
import H5pContent, { H5pSubContent } from '../helpers/h5pContent'
import { H5pInfoDto } from '../web/h5p'
import { CachedH5pContentApi } from '../web/h5p/cachedH5pContentApi'

const logger = withLogger('H5pContentProvider')

@Service()
export class H5pContentProvider {
  constructor(private readonly h5pContentApi: CachedH5pContentApi) {}

  @Benchmark()
  public async getH5pContents(
    h5pIds: ReadonlyArray<string>,
    authenticationToken: string | undefined,
  ): Promise<ReadonlyMap<string, H5pContent>> {
    if (h5pIds.length === 0) {
      return new Map<string, H5pContent>()
    }
    const response = await this.h5pContentApi.getH5pContents(
      h5pIds,
      authenticationToken,
    )

    const contents = new Map(
      response.contents.flatMap(h5pDtoToEntity).map((x) => [x.id, x]),
    )

    return contents
  }
}

function h5pDtoToEntity(h5p: H5pInfoDto): H5pContent {
  const subContents: H5pSubContent[] = flattenRecursive(h5p)
  return {
    id: h5p.id,
    type: h5p.type,
    subContents,
  }
}

function flattenRecursive(
  h5p: H5pInfoDto,
  parent?: H5pInfoDto,
): H5pSubContent[] {
  const subContents: H5pSubContent[] = []
  for (const child of h5p.subContents ?? []) {
    subContents.push(...flattenRecursive(child, h5p))
  }
  if (parent) {
    subContents.unshift({
      id: h5p.id,
      type: h5p.type,
      name: h5p.name,
      parentId: parent.id,
    })
  }
  return subContents
}
