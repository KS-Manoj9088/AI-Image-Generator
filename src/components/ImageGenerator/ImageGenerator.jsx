import React, { useState, useRef } from 'react'
import '../ImageGenerator/ImageGenerator.css'
import default_image from '../Assets/default_image.svg'
import "dotenv/config"

const ImageGenerator = () => {


    const [image_url, setImage_url] = useState("/");
    const [loading, setLoading] = useState(false);

    let inputRef = useRef(null);

    const imageGenerator = async()=>{
        if(inputRef.current.value===""){
            return 0;
        }

        setLoading(true);
        // code to fetch data from API
        const response = await fetch("https://api.openai.com/v1/images/generations",{
            method : "POST",
            headers:{
                "Content-Type" : "application/json",
                Authorization : "Bearer"+process.env.IMAGE_GENERATION_API_KEY,
                "User-Agent" : "Chrome",
            },
            body:JSON.stringify({
                prompt : `${inputRef.current.value}`,
                n : 1,
                size : "512x512",
            }),
        });

        let data = await response.json();
        let data_array = data.data;
        setImage_url(data_array[0].url);
        setLoading(false);  // After Loading Image Reset to default state
    }

  return (
    <div className='ai-image-generator'>
      <div className='header'>
        AI IMAGE <span>GENERATOR</span>
        <div className="img-loading">
            <div className="image">
                <img src={image_url==='/'? default_image:image_url} alt=''/>
                <div className="loading">
                    <div className={loading ? "loading-bar-full" : "loading-bar"}></div>
                    <div className={loading ? "loading-text" : "display-none"}>Loading...</div>
                </div>
            </div>

            <div className="search-box">
                <input type="text" className='search-input' placeholder='Describe What Tou Want To See' ref={inputRef}/>
                <div className="generate-btn" onClick={()=>{imageGenerator()}}>
                    Generate
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default ImageGenerator
