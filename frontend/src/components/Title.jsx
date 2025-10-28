import React from 'react'
import PropTypes from 'prop-types'

const Title = ({text1, text2}) => {
  return (
    <div className='flex items-center justify-center gap-2 font-semibold'>
        <p className='text-gray-800 dark:text-gray-200'>{text1}</p>
        <p className='text-primary dark:text-[#02ADEE]'>{text2}</p>
    </div>
  )
}

Title.propTypes = {
  text1: PropTypes.string.isRequired,
  text2: PropTypes.string.isRequired
}

export default Title
