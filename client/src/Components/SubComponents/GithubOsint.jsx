import React, {useState, useEffect} from 'react';
import { api, toolkit } from '../../api';
import UrlForm from '../HelperComponents/UrlForm';

const GithubOsint = props => {
    const [urls, setUrls] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(()=>{
        api.post('/api/fqdn', {_id: props.thisFqdn._id})
            .then(res=>{
                const urlArray = [];
                urlArray.push(props.thisFqdn.fqdn);
                for (const url of res.data?.recon?.subdomains?.httprobe || []){
                    let temp = url.replace("http://", "").replace("https://", "").replace("/", "");
                    urlArray.push(temp);
                }
                setUrls(urlArray);
                setLoaded(true);
                console.log(urlArray);
            })
    }, [props.thisFqdn._id, props.thisFqdn.fqdn])

    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-12">
                    <p>The links below can be used search for source code on GitHub.</p>
                    <div style={{padding: '10px', maxHeight:'225px', width:'100%', overflowY:'auto', border:'1px solid var(--border)', borderRadius:'8px'}}>
                        {
                            loaded && urls.map((url, i)=>{
                                return (
                                    <div key={i}>
                                    <p className="m-0"><a href={`https://github.com/search?q="${url}"+language%3ABash&type=code`} target="_blank" rel="noreferrer">"{url}" language:Bash</a></p>
                                    <p className="m-0"><a href={`https://github.com/search?q="${url}"+language%3APython&type=code`} target="_blank" rel="noreferrer">"{url}" language:Python</a></p>
                                    <p className="m-0"><a href={`https://github.com/search?q="${url}"+language%3APHP&type=code`} target="_blank" rel="noreferrer">"{url}" language:PHP</a></p>
                                    <p className="m-0"><a href={`https://github.com/search?q="${url}"+language%3ARuby&type=code`} target="_blank" rel="noreferrer">"{url}" language:Ruby</a></p>
                                    <p className="m-0"><a href={`https://github.com/search?q="${url}"+language%3APerl&type=code`} target="_blank" rel="noreferrer">"{url}" language:Perl</a></p>
                                    <p className="m-0"><a href={`https://github.com/search?q="${url}"+language%3APowerShell&type=code`} target="_blank" rel="noreferrer">"{url}" language:PowerShell</a></p>
                                    <p className="m-0"><a href={`https://github.com/search?q="${url}"+language%3ALua&type=code`} target="_blank" rel="noreferrer">"{url}" language:Lua</a></p>
                                    <p className="m-0"><a href={`https://github.com/search?q="${url}"+language%3AGroovy&type=code`} target="_blank" rel="noreferrer">"{url}" language:Groovy</a></p>
                                    <p className="m-0"><a href={`https://github.com/search?q="${url}"+language%3AGo&type=code`} target="_blank" rel="noreferrer">"{url}" language:Go</a></p>
                                    </div>
                                )
                            })
                        }
                        

                    </div>
                </div>
            </div>
            <div className="row">
                <UrlForm thisFqdn={props.thisFqdn} thisScanner="Github"/>
            </div>
        </div>
    )
}

export default GithubOsint;