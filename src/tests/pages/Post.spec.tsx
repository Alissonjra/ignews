import { render, screen} from '@testing-library/react'
import { getPrismicClient } from '../../services/prismic'
import  Post,{ getServerSideProps } from '../../pages/posts/[slug]'
import { mocked } from 'ts-jest/utils'
import { getSession, useSession } from 'next-auth/client'


jest.mock('next-auth/client')
jest.mock('../../services/prismic')

const post = {
    slug: 'new-post',
    title: 'New post',
    content: '<p>Post excerpt</p>',
    updatedAt: '10 de abril'
  }

describe('Post page', () => {
  it('renders correctly', () => {
    const useSessionMocked = mocked(useSession)

    useSessionMocked.mockReturnValueOnce([null,false])
    render(<Post post={post} />)

    expect(screen.getByText("New post")).toBeInTheDocument()
    expect(screen.getByText("Post excerpt")).toBeInTheDocument()
  })

  it('redirects user if no subscription is found',async () => {
    const getSessionMocked = mocked(getSession)

    getSessionMocked.mockResolvedValueOnce(null)

    const response = await getServerSideProps({params: {slug: 'new-post'}} as any)

    expect(response).toEqual(
      expect.objectContaining({
        redirect:expect.objectContaining ({
          destination: '/',
        })
    })
    )
  })

  it('load initial data',async () => {
    const getSessionMocked = mocked(getSession)
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


    getSessionMocked.mockResolvedValueOnce({
      activeSubscription: 'fake-active-subscription'
    } as any)

    const response = await getServerSideProps({
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