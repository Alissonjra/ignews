import { render, screen} from '@testing-library/react'
import { getPrismicClient } from '../../services/prismic'
import  Post,{ getStaticProps } from '../../pages/posts/preview/[slug]'
import { mocked } from 'ts-jest/utils'
import { getSession, useSession } from 'next-auth/client'
import { useRouter } from 'next/dist/client/router'


jest.mock('next-auth/client')
jest.mock('next/dist/client/router')
jest.mock('../../services/prismic')

const post = {
    slug: 'new-post',
    title: 'New post',
    content: '<p>Post excerpt</p>',
    updatedAt: '10 de abril'
  }

describe('Post Preview page', () => {
  it('renders correctly', () => {
    const useSessionMocked = mocked(useSession)

    useSessionMocked.mockReturnValueOnce([null,false])
    render(<Post post={post} />)

    expect(screen.getByText("New post")).toBeInTheDocument()
    expect(screen.getByText("Post excerpt")).toBeInTheDocument()
    expect(screen.getByText("Wanna continue reading?")).toBeInTheDocument()
  })

  it('redirects user to full post when user is subscribed',async () => {
    const useSessionMocked = mocked(useSession)
    const useRouterMocked = mocked(useRouter)
    const pushMock = jest.fn()

    useSessionMocked.mockReturnValueOnce([
      { activeSubscription: 'fake-active-subscription' },
      false
    ]as any)

    useRouterMocked.mockReturnValueOnce({
      push: pushMock
    }as any)
    
    render(<Post post={post} />)

    expect(pushMock).toHaveBeenCalledWith('/posts/new-post')
  })

  it('load initial data',async () => {
    const getPrismicClientMocked = mocked(getPrismicClient)
    
    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title:[
            {type: 'heading', text: 'New post'}
          ],
          content: [
            {type: 'paragraph', text: 'Post content'}
          ],
        },
        last_publication_date: '04-01-2021'
      })
    }as any)

    const response = await getStaticProps({
      params: {slug: 'new-post'}
    } as any)

    expect(response).toEqual(
      expect.objectContaining({
       props:{
         post:{
          slug:'new-post',
          title: 'New post',
          content: '<p>Post content</p>',
          updatedAt: '01 de abril de 2021'
         }
       }
    })
    )
  })
})