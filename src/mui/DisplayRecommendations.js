import { Box, Button, Card, CardActions, CardContent, CardMedia,CircularProgress, Grid, Paper, Typography, Zoom } from '@mui/material';
import React, { useEffect, useState } from 'react'
import getCreds from "../cred/cred";
import axios from 'axios';
import { Link } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Host from "../cred/Host"

function DisplayRecommendations(props) {
    //gets credentials for API (saved on pc, not gh)
    const credentials = getCreds()
    const id = props.id //id of the movie thats being used for recommended search
    const [movies, setMovies] = useState([]) //map that will be printed out
    const [recommendationStatus, setrecommendationStatus] = useState('waiting') //status
    const [myList, setMyList] = useState([]) //list of id:s on DB
    const [myListStatus, setMyListStatus] = useState('waiting') //status
    const [watchProviderStatus, setWatchProviderStatus] = useState('') //status
    const [fade, setFade] = useState(false) //for cool fade effect

    const host = Host()

    //cuts down the amount of recommendations to 3 and fetches watch providers for them
    const generateRecommendation = async(result) => {
        const recommended = [] //will be added to movies
        const idArray = [] //array of ids (in recommended) for easy check
        //add 3 movies
        while (recommended.length < 3) {
            //random index
            let index = Math.round(Math.random() * (result.length - 1))
            let movie = result[index] //movie based on index

            //not already in watch history or recommended(already added)
            if (!idArray.includes(movie.id) && !myList.includes(movie.id)) {
                idArray.push(movie.id)

                try {
                    //get watch providers
                    const connection = await axios.get('https://api.themoviedb.org/3/movie/' + movie.id + '/watch/providers?api_key=' + credentials)
                    const json = await connection.data

                    let hasBuy = false
                    let hasRent = false
                    let hasFlatrate = false

                    try {
                        //If movie providers are not empty(have items) set booleans to true for easy handling in return
                        if(json.results.FI.buy.length !== 0) hasBuy = true
                        if(json.results.FI.rent.length !== 0) hasRent = true
                        if(json.results.FI.flatrate.length !== 0) hasFlatrate = true
                    } catch (error) {
                        
                    }
                    //adds one movie to list(to be displayed)
                    recommended.push({
                        id: movie.id,
                        poster_path: movie.poster_path,
                        title: movie.title,
                        overview: movie.overview,
                        provider: json.results.FI,
                        hasBuy: hasBuy,
                        hasRent: hasRent,
                        hasFlatrate: hasFlatrate
                    })

                } catch (error) {
                    setWatchProviderStatus('provider error')
                }
                //-----

                
            }
        }
        
        setMovies(recommended) //add 3 movies
        setrecommendationStatus('')
        setFade(true) //enable showing of items

    }

    //searches for a big list of recommendations based on id
    const getRecommendations = async () => {
        if(myList.length <= 0) return
        try {
            const connection = await fetch('https://api.themoviedb.org/3/movie/' + id + '/recommendations?api_key='+credentials+'&language=en-US&page=1')
            const json = await connection.json()
            //setMovies(json.results)
            generateRecommendation(json.results)
        } catch (error) {
            setrecommendationStatus('error fetching recommendations from API')
        }

    }

    //get ids of all movies in watch history
    const getMyList = async () => {
        try {
            const connection = await fetch(host + 'all-id')
            const json = await connection.json()
            //change from json to array for easy handling
            let array = []
            json.forEach(e => {
                array.push(e.id)
            })
            setMyList(array)
            setMyListStatus('')
        } catch (error) {
            setMyListStatus('error fetching own history')
        }


    }

    useEffect(() => {
        getMyList()
        // eslint-disable-next-line
    }, [])

    useEffect(() => {
        getRecommendations()
        setFade(false)
        // eslint-disable-next-line
    }, [myList])

    if (id === 0) {
        return (
            <Box sx={{ paddingTop: 2, marginLeft: 2 }}>
                <Typography variant="h4">Add movies to your watch history to get recommendations here</Typography>
            </Box>
        )
    }else if (recommendationStatus.length === 0 && myListStatus.length === 0 && watchProviderStatus.length === 0) {
        //Successfull fetches -> render outcome
        return (
            <Box sx={{ paddingTop: 2, marginLeft: 2 }}>
                <Typography variant="h3">Based on your watch history you may be interested in these:</Typography>
                {movies.map(movie => {
                    return (
                        <Zoom in={fade} style={{ transitionDelay: fade ? '500ms' : '0ms' }} key={movie.id}>
                        <Grid container spacing={2} sx={{marginTop:3}}>
                            <Grid item>
                                <Card>
                                <CardMedia component="img" image={"http://image.tmdb.org/t/p/w500" + movie.poster_path} height='300' width='120'></CardMedia>
                                </Card>
                            </Grid>
                            <Grid item>
                                <Card sx={{width: 600, height: 300, overflow: 'auto'}}>
                                    <CardContent>
                                        <Typography variant="h4">{movie.title}</Typography>
                                        <Typography>{movie.overview}</Typography>
                                        </CardContent>
                                    <CardActions>
                                        <Button component={Link} to={"/home/info/" + movie.id}>More info</Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                            <Grid item>
                            {movie.hasBuy &&

                                <Accordion sx={{width: 300}}>
                                    <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1a-content"
                                    id="panel1a-header"
                                    >
                                    <Typography>Buy</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                    {movie.provider.buy.map(buy => {
                                        return (<Box key={buy.provider_id}>
                                                    <Box sx={{float:'left'}} component="img" height="20px" src={"http://image.tmdb.org/t/p/w500" + buy.logo_path}></Box>
                                                    <Typography sx={{paddingBottom: 1, paddingLeft: 3}}>{buy.provider_name}</Typography>
                                                </Box>)
                                    })}
                                    </AccordionDetails>
                                </Accordion>    

                            }

                            {movie.hasRent &&

                                <Accordion sx={{width: 300}}>
                                    <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1a-content"
                                    id="panel1a-header"
                                    >
                                    <Typography>Rent</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                    {movie.provider.buy.map(rent => {
                                        return (<Box key={rent.provider_id}>
                                            <Box sx={{float:'left'}} component="img" height="20px" src={"http://image.tmdb.org/t/p/w500" + rent.logo_path}></Box>
                                            <Typography sx={{paddingBottom: 1, paddingLeft: 3}}>{rent.provider_name}</Typography>
                                        </Box>)
                                    })}
                                    </AccordionDetails>
                                </Accordion>

                            }

                            {movie.hasFlatrate &&

                                <Accordion sx={{width: 300}}>
                                    <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1a-content"
                                    id="panel1a-header"
                                    >
                                    <Typography>Stream</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                    {movie.provider.buy.map(flatrate => {
                                        return (<Box key={flatrate.provider_id}>
                                            <Box sx={{float:'left'}} component="img" height="20px" src={"http://image.tmdb.org/t/p/w500" + flatrate.logo_path}></Box>
                                            <Typography sx={{paddingBottom: 1, paddingLeft: 3}}>{flatrate.provider_name}</Typography>
                                        </Box>)
                                    })}
                                    </AccordionDetails>
                                </Accordion>

                            }
                            </Grid>
                            <Paper color="primary" sx={{height: 1}}></Paper>
                        </Grid>
                        </Zoom>
                    )
                })}
            </Box>
        )
    } else {
        //Status gives error
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress></CircularProgress>
                <Typography>{recommendationStatus}</Typography>
                <Typography>{myListStatus}</Typography>
                <Typography>{watchProviderStatus}</Typography>
            </Box>
        )
    }


}

export default DisplayRecommendations;